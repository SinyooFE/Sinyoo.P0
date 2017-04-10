import { Component, ViewContainerRef, AfterViewInit } from '@angular/core';
import { Title } from "@angular/platform-browser";
import { Router, Event as RouterEvent, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Location } from '@angular/common';
import { PageScrollConfig } from 'ng2-page-scroll';

//导入“修改密码”模态框
import { UserChangePasswordLogComponent } from './user/user-changePassword-log.component';

//autho2 认证服务
import { UserManager, Log, MetadataService, User, UserManagerSettings } from 'oidc-client';

import { Overlay, overlayConfigFactory } from 'angular2-modal';
import { Modal, BSModalContext } from 'angular2-modal/plugins/bootstrap';

import { SystemFunctionModel } from '../models/main.model';
import { AuthenicationService, QueryAuthorizeInfo, BaseService, UserService } from '../services';

import { BusyModule } from 'angular2-busy';
import { Subscription, Subject } from 'rxjs';

import _ from 'lodash';

@Component({
    // moduleId: module.id,
    selector: 'sinyoo-main',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    host: {
        '(window:resize)': 'windowResize($event)'
    }
})

export class AppComponent implements AfterViewInit {
    private canReportError = true;
    /**
     * 功能菜单
     */
    mainFunctionList: SystemFunctionModel[] = [];
    /**
     * 当前用户名
     */
    currentUserName: string;
    /**
     * 页面的路由的url地址
     */
    routerUrlName: string;
    /**
     * 等待框
     */
    busy: any;
    /**
     * 编辑区域高度
     */
    editorHeight = 0;

    constructor(private titleService: Title,
        private router: Router,
        private overlay: Overlay,
        private vcRef: ViewContainerRef,
        public modal: Modal,
        private baseService: BaseService,
        private authService: AuthenicationService,
        private location: Location) {

        overlay.defaultViewContainer = vcRef;

        this.mainFunctionList.push(new SystemFunctionModel('terminology', '肿瘤叙词表', '/terminology', '&#xe60b;', true));
        this.mainFunctionList.push(new SystemFunctionModel('template', '数据模板', '/standard', '&#xe602;', true));
        this.mainFunctionList.push(new SystemFunctionModel('logistic', '医学逻辑', '/logistic', '&#xe604;', false));
        this.mainFunctionList.push(new SystemFunctionModel('mapping', 'Mapping', '/mapping', '&#xe609;', true));
        this.mainFunctionList.push(new SystemFunctionModel('task', '我的工作', '/mytask', '&#xe608;', true));
        this.routerUrlName = this.location.path(false);

        _.forEach(this.mainFunctionList, (item) => {
            if ((`/${_.trim(this.routerUrlName, '/')}/`).indexOf(`/${_.trim(item.route, '/')}/`) > -1) {
                item.class = 'e';
            } else {
                item.class = '';
            }
        });

        //定位锚点时默认距离值
        PageScrollConfig.defaultScrollOffset = 80;
    }

    ngAfterViewInit(): void {
        this.baseService.contentHeight.debounceTime(500)
            .distinctUntilChanged()
            .subscribe((data) => {               
                this.editorHeight = data;
                console.log('contentheight:' + this.editorHeight);
            });
        this.windowResize();

        //报错
        this.baseService.errorReport.subscribe((error) => {
            if (this.canReportError) {
                this.canReportError = false;
                this.modal.alert()
                    .size('sm')
                    .isBlocking(true)
                    .showClose(false)
                    .title('错误')
                    .body(error)
                    .open().then(data => {
                        data.result.then(() => { this.canReportError = true; });
                    }).catch(() => { this.canReportError = true; });
            }
        });

        //等待遮罩
        this.baseService.busyReport.subscribe((data) => {
            this.busy = data;
        });

        //用户信息
        this.authService.userReport.subscribe((user) => {
            this.currentUserName = user.profile.preferred_username;
        });
    }

    /**
     * 登出
     */
    logOff() {
        this.authService.logOff();
    }

    /**
     * 设置页面标题
     * @param newTitle
     */
    setTitle(newTitle: string): void {
        this.titleService.setTitle(!_.isNil(newTitle) ? 'Sinyoo.P0' : newTitle);
    }

    /**
     * 功能导航
     * @param event
     * @param mainFun
     */
    loadFunction(event, mainFun: SystemFunctionModel): void {
        if (!mainFun.enable) return;

        _.map(this.mainFunctionList, (item) => {
            if (item.key === mainFun.key) {
                item.class = 'e';
            } else {
                item.class = '';
            }
        });

        //设置页面标题
        this.setTitle(mainFun.name);
        //导航
        let link = [`${mainFun.route}`];
        this.router.navigate(link);
    }

    /**
     * 窗体大小改变事件
     * @param event
     */
    windowResize(event = null) {
        this.baseService.contentHeight.next(window.innerHeight - 80);
    }

    /*
        点击-修改密码弹出“模态框”的触发事件
    */
    loadChangePasswordLog() {
        this.modal.open(UserChangePasswordLogComponent, overlayConfigFactory({}, BSModalContext));
    }
}