import { Component, ViewContainerRef, ViewEncapsulation } from '@angular/core';

//弹出模态框必须的模块
import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal,BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { UserService } from '../../services/authenication';

import  { LogAction, LogAuditAction } from 'crabyter-p0-server/Enum';

import _ from 'lodash';

@Component({
    // moduleId: module.id,
    selector: 'user-changePassword-log',
    styleUrls: ['user-changePassword-log.component.css'],
    templateUrl: 'user-changePassword-log.component.html'
})

export class UserChangePasswordLogComponent implements CloseGuard, ModalComponent<BSModalContext>{

    public old_password: string="";
    public new_password: string="";
    public new_password_again: string = "";
    //匹配所有非a-z A-Z 0-9
    public reg = /\W+/;

    constructor(public dialog: DialogRef<BSModalContext>, public userService: UserService, public modal: Modal) {
        dialog.context.dialogClass = "modal-dialog modal-sm";
        dialog.context.inElement = true;
        dialog.setCloseGuard(this);
    }
    public checkPassword(newPassword, oldPassword, newPasswordAgain, userService) {
        if (newPassword === "" || oldPassword === "" || newPasswordAgain === "") {
            this.modal.alert()
                .title('提示')
                .message('密码不能为空！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }
        else if (this.reg.test(newPassword) || this.reg.test(newPasswordAgain) || this.reg.test(oldPassword)) {
            this.modal.alert()
                .title('提示')
                .message('抱歉，密码只能为数字和英文字母的组合')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }
        else if (newPassword === oldPassword) {
            this.modal.alert()
                .title('提示')
                .message('抱歉，新密码不能和原密码相同！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }
        else if (newPassword !== newPasswordAgain) {
            alert("重复密码错误");
            this.modal.alert()
                .title('提示')
                .message('抱歉，重复密码错误！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }
        
        else {
            this.userService.checkPasswordService(newPassword, oldPassword).subscribe(response => {
                if (!response) {
                    console.log(response);
                    alert("原密码错误");
                }
                else {
                    alert("密码修改成功");
                    this.cancel();
                }
            });
        }
        
    }

    /**
     * 初始化数据
        ngOnInit(): void {
        if (this.context.conceptId !== undefined
            && this.context.conceptId !== null
            && this.context.conceptId !== '') {
            this.terminologyService.getConceptLog(this.context.conceptId)
                .subscribe((rep) => {
                    this.conceptLogList = rep;
                    if (this.conceptLogList != undefined &&
                        this.conceptLogList != null &&
                        this.conceptLogList.length > 0) {
                        this.selectedConceptLog = new SelectedConceptLog(this.conceptLogList[0]);
                    }
                });
        }
    }
     */
    
    /**
     * 保存标准
     */
    ok() {

    }

    /**
     * 取消
     */
    cancel() {
        this.dialog.close({ IsOk: false });
    }
}