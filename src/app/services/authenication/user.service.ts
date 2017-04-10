import { Injectable, Inject, forwardRef } from '@angular/core';
import { Http } from '@angular/http';

import { BaseService } from '../';

@Injectable()
export class UserService {

    constructor(
        private httpHelper: BaseService
    ) { }

    public checkPasswordService(newPassword: string, oldPassword: string) {
        return this.httpHelper.put(`/user/changepassword?oldPassword=${oldPassword}&newPassword=${newPassword}`)
            .map(response => response as boolean);
    }
}
