
import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';

// auth2认证服务
import { UserManager, Log, MetadataService, User, UserManagerSettings } from 'oidc-client';

import { Observable } from 'rxjs/Observable';

import { BaseService } from '../';

import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

@Injectable()
export class QueryAuthorizeInfo {
    private authorizeInfo: AuthorizeInfo;
    private isQueriedAuthroizeInfo = false;

    constructor(private baseService: BaseService) {
        //获取登录用户信息
        this.authorizeInfo = new AuthorizeInfo();
        this.getAuthorizeInfo();
    }

    /**
     * 获取用户权限信息
     */
    getAuthorizeInfo() {
        return new Promise<AuthorizeInfo>((resolve, reject) => {
            if (this.isQueriedAuthroizeInfo) {
                resolve(this.authorizeInfo);
            } else {
                this.getUserAuthorizeInfo()
                    .subscribe((data) => {
                        this.isQueriedAuthroizeInfo = true;
                        this.authorizeInfo.P0_ConceptTypeMaintain = data.P0_ConceptTypeMaintain;
                        this.authorizeInfo.P0_AddConcept = data.P0_AddConcept;
                        this.authorizeInfo.P0_ApproveConcept = data.P0_ApproveConcept;
                        this.authorizeInfo.P0_DeleteConcept = data.P0_DeleteConcept;
                        this.authorizeInfo.P0_DragAndSortConcept = data.P0_DragAndSortConcept;
                        this.authorizeInfo.P0_ModifyConcept = data.P0_ModifyConcept;
                        this.authorizeInfo.P0_ReadConcept = data.P0_ReadConcept;
                        resolve(this.authorizeInfo);
                    });
            }
        });
    }

    /**
     * 获取用户功能模块信息
     */
    private getUserAuthorizeInfo() {
        return this.baseService.get(`/user/permission`)
            .map(data => data as server.UserRightViewModel);
    }
}

/**
 * 用户权限模块
 */
export class AuthorizeInfo {
    //可以查看概念
    P0_ReadConcept = true;
    //可以批准概念
    P0_ApproveConcept = false;
    //可以拖动概念
    P0_DragAndSortConcept = false;
    //可以修改概念
    P0_ModifyConcept = false;
    //可以删除概念
    P0_DeleteConcept = false;
    //可以新增概念
    P0_AddConcept = false;
    //可以维护概念
    P0_ConceptTypeMaintain = false;
}