import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router } from '@angular/router';
import { Location } from '@angular/common';

import { AuthenicationService } from './auth.service';
import { AuthorizeInfo, QueryAuthorizeInfo } from './authorize.service';

import { ConceptOperateType } from 'crabyter-p0-server/Enum';

import _ from 'lodash';

@Injectable()
export class CanActivateLoginService implements CanActivate {

    constructor(
        private authService: AuthenicationService,
        private router: Router
    ) {
        this.router.events.subscribe((event) => {
            //console.log(event);
            //弹框存在，不能离开
            let tempModal = $('body').find('modal-overlay');
            if (tempModal.length > 0) {
                //console.log('跳转');
                this.router.navigate([this.router.url]);
            }
        });
    }

    canActivate() {
        //console.log('canActivate');
        return this.authService.queryIsLogin();
    }
}

@Injectable()
export class CanActivateChildLoginService implements CanActivateChild {

    constructor(
        private authService: AuthenicationService,
        private router: Router
    ) {
        this.router.events.subscribe((event) => {
            //console.log(event);
            //弹框存在，不能离开
            let tempModal = $('body').find('modal-overlay');
            if (tempModal.length > 0) {
                //console.log('跳转');
                this.router.navigate([this.router.url]);
            }
        });
    }

    canActivateChild() {
        //console.log('canActivateChild');
        return this.authService.queryIsLogin();
    }
}
