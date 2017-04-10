import * as server from 'crabyter-p0-server/ViewModel';

/**
 * 顶部导航
 */
export class SystemFunctionModel {
    public key: string;
    public name: string;
    public route: string;
    public icon: string;
    public enable: boolean;
    public class: string;

    constructor(srcKey: string, srcName: string, srcRoute: string, srcIcon: string, srcEnable, srcClass: string = '') {
        this.key = srcKey;
        this.name = srcName;
        this.route = srcRoute;
        this.icon = srcIcon;
        this.enable = srcEnable;
        this.class = srcClass;
    }
}

/**
 * tab页
 */
export class TabFunctionModel {
    public key: string;
    public name: string;

    constructor(srcKey: string, srcName: string) {
        this.key = srcKey;
        this.name = srcName;
    }
}

/**
 * 标准key
 */
export const LOCAL_STORAGE_STANDARD_KEY = 'standardkey';

/**
 * returnUrl
 */
export const LOCAL_STORAGE_RETURNURL_KEY = 'returnUrl';

/**
 * 用户标准编辑LocalStorage实体
 */
export class LocalStorageStandardModel {
    standard: server.S_StandardViewModel;
    domain: server.S_DomainViewModel;
}




