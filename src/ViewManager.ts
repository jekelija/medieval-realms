import '../css/view';
import * as log from 'loglevel';

export enum VIEW {
    LOGIN=0,
    USER_SCREEN=1,
    GAME=2
}

export interface IView {
    type(): VIEW;

    element(): HTMLDivElement;

    open(data?:any): void;
    close(): void;
}

export class ViewManager {

    public currentView: IView;

    private views:Map<VIEW,IView> = new Map();

    registerView(view: IView) {
        this.views.set(view.type(), view);
    }

    open(type:VIEW, data?:any) {
        if(this.views.has(type)) {
            if(this.currentView) {
                this.currentView.element().classList.add('hidden');
                this.currentView.close();
            }
            this.currentView = this.views.get(type);
            this.currentView.element().classList.remove('hidden');
            this.currentView.open(data);
        }
        else {
            log.error('Cannot find view of type ' + type);
        }
        
    }
}