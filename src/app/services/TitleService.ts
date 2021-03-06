import {Injectable} from '@angular/core'

@Injectable()
export class TitleService {
    private prefix = 'NG2 Chatty'
    private count = 0
    private passiveMode = false
    private visible

    constructor() {
        //initialize stuff
        document.addEventListener('visibilitychange', () => this.changed())
        document.addEventListener('webkitvisibilitychange', () => this.changed())
        document.addEventListener('msvisibilitychange', () => this.changed())
        this.changed()
    }

    setPassive() {
        this.passiveMode = true
    }

    updateTitle(add) {
        setTimeout(() => {
            this.count += add

            if (this.count > 0 && !this.visible) {
                document.title = this.prefix + ' (' + this.count + ')'
            } else {
                document.title = this.prefix
            }
        })
    }

    private changed() {
        this.visible =
            !(document['hidden'] ||
            document['webkitHidden'] ||
            document['mozHidden'] ||
            document['msHidden'])

        if (this.visible) {
            this.count = 0
            this.updateTitle(0)
        }
    }
}
