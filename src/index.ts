import '../css/global';

import { LoginController } from "./LoginController";
import { UserScreenController } from "./UserScreenController";
import { Services } from './Services';
import { ViewManager, VIEW } from './ViewManager';
import { GameController } from './GameController';

const services = new Services();
const viewManager = new ViewManager();
const loginController = new LoginController(viewManager, services);
const userScreenController = new UserScreenController(viewManager, services);
const gameController = new GameController(viewManager, services);
viewManager.registerView(loginController);
viewManager.registerView(userScreenController);
viewManager.registerView(gameController);

if(services.currentUser) {
    viewManager.open(VIEW.USER_SCREEN);
}
else {
    viewManager.open(VIEW.LOGIN);
}
