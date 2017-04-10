import { Injectable, EventEmitter } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common'

import { Observable } from 'rxjs/Observable';

//autho2 认证服务
import { UserManager, Log, MetadataService, User, UserManagerSettings } from 'oidc-client';

import { LocalStorageService } from 'ng2-webstorage';

import { LOCAL_STORAGE_RETURNURL_KEY } from '../../models';

import { AuthSettings } from '../../environment';

import _ from 'lodash';

@Injectable()
export class AuthenicationService {
    /**
     * 环境配置
     */
    private settings: UserManagerSettings = AuthSettings;
    /**
     * 用户管理
     */
    private mgr = new UserManager(this.settings);
    /**
     * 当前用户信息
     */
    private currentUser: User;
    /**
     * 是否登陆
     */
    private loggedIn = false;
    /**
     * 权限信息请求头
     */
    private authHeaders: Headers = null;

    /**
     * 用户信息
     */
    userReport = new EventEmitter<User>();

    constructor(private router: Router, private location: Location, private storage: LocalStorageService) {
        if ((<any>window).authSettings) {
            this.settings = (<any>window).authSettings;
            this.mgr = new UserManager(this.settings);
        }

        //用户已经登出
        this.mgr.events.addUserUnloaded((e) => {
            console.log("用户登出");
            this.currentUser = null;
            this.loggedIn = false;
        });
        //用户已经登录
        this.mgr.events.addUserLoaded((user) => {
            console.log("用户登录");
            this.loggedIn = true;
            this.currentUser = user;
        });
        //访问令牌失效
        this.mgr.events.addAccessTokenExpired(data => {
            console.log("用户令牌失效");
            this.currentUser = null;
            this.loggedIn = false;
            this.mgr.clearStaleState();
            this.mgr.removeUser();

            this.mgr.signinRedirect();
        });
    }

    /**
     * 登出
     */
    logOff() {
        return this.mgr.signoutRedirect();
    }

    /**
     * 获取用户信息
     */
    queryUser() {
        return new Promise<Oidc.User>((resolve, reject) => {
            if (this.loggedIn) {
                resolve(this.currentUser);
            } else {
                this.mgr.getUser()
                    .then((user) => {
                        if (user) {
                            this.loggedIn = true;
                            this.currentUser = user;
                            //用户
                            this.userReport.emit(this.currentUser);
                            resolve(this.currentUser);
                        }
                        else {
                            //保存跳转前路径
                            this.storage.store(LOCAL_STORAGE_RETURNURL_KEY, this.location.path(false));
                            this.mgr.signinRedirect().then(() => {
                                this.loggedIn = false;
                                reject(this.currentUser);
                            });
                        }
                    }).catch((err) => {
                        this.loggedIn = false;
                        reject(this.currentUser);
                    });
            }
        });
    }

    /**
     * 执行queryUser，用户组件canActive用户登陆检测
     */
    queryIsLogin() {
        return new Promise<boolean>((resolve, reject) => {
            //目的在于执行queryUser方法，所以resolve均为true
            this.queryUser().then(() => {
                resolve(true);
            }).catch(() => {
                resolve(true);
            });
        });
    }

    /**
     * 设置用户已经登录
     * @param currUser
     */
    setUser(currUser: Oidc.User): void {
        this.currentUser = currUser;
        this.loggedIn = true;
        //用户
        this.userReport.emit(this.currentUser);
    }

    /**
     * 请求头
     * @param user
     */
    getHeader() {
        this.authHeaders = new Headers();
        if (!_.isNil(this.currentUser)) {
            this.authHeaders.append('Authorization', this.currentUser.token_type + " " + this.currentUser.access_token);
            this.authHeaders.append('Content-Type', 'application/json');
        }
        return this.authHeaders;
    }



    /*****未使用，有需要可修改******/

    clearState() {
        this.mgr.clearStaleState().then(() => {
            console.log("clearStateState success");
        }).catch((e) => {
            console.log("clearStateState error", e.message);
        });
    }

    getUser() {
        this.mgr.getUser().then((user) => {
            console.log("got user", user);
            this.userReport.emit(user);
        }).catch((err) => {
            console.log(err);
        });
    }

    removeUser() {
        this.mgr.removeUser().then(() => {
            this.userReport.emit(null);
            console.log("user removed");
        }).catch((err) => {
            console.log(err);
        });
    }

    startSigninMainWindow() {
        this.mgr.signinRedirect({ data: 'some data' }).then(() => {
            console.log("signinRedirect done");
        }).catch((err) => {
            console.log(err);
        });
    }

    endSigninMainWindow() {
        this.mgr.signinRedirectCallback().then((user) => {
            console.log("signed in", user);
        }).catch((err) => {
            console.log(err);
        });
    }

    startSignoutMainWindow() {
        this.mgr.signoutRedirect().then((resp) => {
            console.log("signed out", resp);
            setTimeout(5000,
                () => {
                    console.log("testing to see if fired...");
                });
        }).catch((err) => {
            console.log(err);
        });
    };

    endSignoutMainWindow() {
        this.mgr.signoutRedirectCallback().then((resp) => {
            console.log("signed out", resp);
        }).catch((err) => {
            console.log(err);
        });
    };

    /*****未使用，有需要可修改******/
}

