
import { Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';

//autho2 认证服务
import { UserManager, Log, MetadataService, User, UserManagerSettings } from 'oidc-client';

import { LocalStorageService } from 'ng2-webstorage';

import { LOCAL_STORAGE_RETURNURL_KEY } from '../../models';

import { AuthenicationService } from '../../services/authenication';

import * as _ from 'lodash';

@Component({
    // moduleId: module.id,
    templateUrl: 'authenication.component.html',
    styleUrls: ['authenication.component.css']
})

export class AuthenicationComponent implements OnInit {

    constructor(
        private router: Router, 
        private auth: AuthenicationService, 
        private storage: LocalStorageService) {

    }

    ngOnInit(): void {
        new UserManager({})
            .signinRedirectCallback()
            .then(user => {
                if (!_.isNil(user)) {
                    this.auth.setUser(user);
                    let returnUrl = this.storage.retrieve(LOCAL_STORAGE_RETURNURL_KEY);
                    if (!_.isNil(returnUrl)) {
                        this.router.navigate([returnUrl]);
                    } else {
                        this.router.navigate(['/terminology']);
                    }
                }
            });
    }

}