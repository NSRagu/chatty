angular.module('chatty')
    .service('eventService', function($http, $timeout, $interval, modelService, settingsService) {
        var eventService = {};
        var lastEventId = 0;

        //load on startup
        eventService.load = function load() {
            modelService.clear();

            $http.get('http://winchatty.com/v2/getNewestEventId')
                .success(function(data) {
                    lastEventId = data.eventId;
                }).error(function(data) {
                    console.log('Error during getNewestEventId: ', data);
                });

            $http.get('http://winchatty.com/v2/getChatty')
                .success(function(data) {
                    processChatty(data.threads, []);
                }).error(function(data) {
                    console.log('Error during getChatty: ', data);
                });
        };

        function processChatty(newThreads, collapsedThreads) {
            $timeout(function() {
                if (newThreads.length > 0) {
                    var thread = newThreads.shift();

                    if (settingsService.isCollapsed(thread.threadId)) {
                        collapsedThreads.push(thread);
                    } else {
                        modelService.addThread(thread);
                    }

                    processChatty(newThreads, collapsedThreads);
                } else {
                    //add collapsed threads in at end
                    _.each(collapsedThreads, function(thread) {
                        modelService.addThread(thread);
                    });

                    //clean collapsed thread list after initial load
                    modelService.cleanCollapsed();

                    //start events
                    return waitForEvents();
                }
            });
        }

        function waitForEvents() {
            $http.get('http://winchatty.com/v2/waitForEvent?lastEventId=' + lastEventId)
                .success(function(data) {
                    eventResponse(data);
                }).error(function(data) {
                    console.log('Error during waitForEvent: ', data);
                    eventResponse(data);
                });
        }

        function eventResponse(data) {
            if (data && !data.error) {
                lastEventId = data.lastEventId;

                //process the events
                data.events.forEach(newEvent);

                //wait for more
                waitForEvents();
            } else {
                if (data && data.error && data.code === 'ERR_TOO_MANY_EVENTS') {
                    console.log('Too many events since last refresh, reloading chatty.');
                    $timeout(function() {
                        eventService.load();
                    });
                } else {
                    //restart events
                    $timeout(function() {
                        waitForEvents();
                    }, 30000)
                }
            }
        }

        function newEvent(event) {
            if (event.eventType === 'newPost') {
                if (event.eventData.post.parentId === 0) {
                    modelService.addThread(event.eventData.post, true);
                } else {
                    modelService.addPost(event.eventData.post);
                }
            } else if (event.eventType === 'categoryChange') {
                modelService.changeCategory(event.eventData.postId, event.eventData.category);
            } else {
                console.log('Unhandled event', event);
            }
        }

        return eventService;
    });