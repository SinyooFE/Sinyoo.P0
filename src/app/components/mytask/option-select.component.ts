import { Component } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { OptionsModel, OptionItem } from '../../models';
import { TaskOperateType, ApprovalStatus } from 'crabyter-p0-server/Enum';

import _ from 'lodash';

export class OptionSelectContext extends BSModalContext {
    public taskFilter: OptionsModel;

}

/**
 * A Sample of how simple it is to create a new window, with its own injects.
 */
@Component({
    selector: 'option-select',
    templateUrl: 'option-select.component.html'
})
export class OptionSelectDialog implements CloseGuard, ModalComponent<OptionSelectContext> {
    context: OptionSelectContext;
    myTaskFilter: OptionsModel;
    //public shouldUseMyClass: boolean;


    constructor(public dialog: DialogRef<OptionSelectContext>) {
        this.context = dialog.context;
        dialog.context.size = 'sm';
        this.myTaskFilter = _.clone(this.context.taskFilter);

        dialog.setCloseGuard(this);

    }

    onclose(ok: boolean) {

        this.dialog.close({ IsOk: ok, filter: this.myTaskFilter });
    }

    beforeDismiss(): boolean {
        return false;
    }

    beforeClose(): boolean {
        return false;
    }
}
