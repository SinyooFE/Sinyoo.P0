import { Component, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { TerminologyService } from '../../services/terminology';

import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class ConceptTypeEditorContext extends BSModalContext {
    /**
     * 在下级新增 = '0'
     * 在同级新增 = '1'
     * 编辑 = '2'
     */
    action:string;
    selectedTypeDetail: server.T_ConceptTypeViewModel;
    currentTypeDetail: server.T_ConceptTypeViewModel;
}


@Component({
    // moduleId: module.id,
    selector: 'concepttype-editor',
    styleUrls: ['concepttype-editor.component.css'],
    templateUrl: 'concepttype-editor.component.html'
})

export class ConceptTypeEditorComponent implements CloseGuard, OnInit, ModalComponent<ConceptTypeEditorContext>  {
    context: ConceptTypeEditorContext;
    editCommonAttributeValue = '';

    constructor(public dialog: DialogRef<ConceptTypeEditorContext>, private terminologyService: TerminologyService) {
        dialog.context.size = 'sm';
        dialog.context.inElement = true;
        dialog.setCloseGuard(this);
        this.context = dialog.context;
        this.initData();
    }

    ngOnInit(): void {

    }

    /**
     * 初始化数据
     */
    initData(): void {
        this.context.currentTypeDetail = <server.T_ConceptTypeViewModel>{};

        switch (this.context.action) {
            case '0':
                {
                    this.context.currentTypeDetail.PConceptTypeID = this.context.selectedTypeDetail.ConceptTypeID;
                }; break;
            case '1':
                {
                    this.context.currentTypeDetail.PConceptTypeID = this.context.selectedTypeDetail.PConceptTypeID;
                }; break;
            case '2':
                {
                    this.context.currentTypeDetail = _.cloneDeep(this.context.selectedTypeDetail);
                }; break;
        }
    }

    onclose(ok: boolean) {
        this.dialog.close({ IsOk: ok });
    }

    beforeDismiss(): boolean {
        return false;
    }

    beforeClose(): boolean {
        return false;
    }

    /**
     * 保存标准
     */
    ok() {
        if (this.context.currentTypeDetail.ConceptTypeID === undefined
            || this.context.currentTypeDetail.ConceptTypeID === null
            || this.context.currentTypeDetail.ConceptTypeID === '') {
            this.terminologyService.addConceptType(this.context.currentTypeDetail)
                .subscribe((data) => {
                    this.dialog.close({ IsOk: true, model: data });
                });
        } else {
            this.terminologyService.updateConceptType(this.context.currentTypeDetail.ConceptTypeID, this.context.currentTypeDetail)
                .subscribe((data) => {
                    this.dialog.close({ IsOk: true, model: data });
                });
        }
    }

    /**
     * 取消
     */
    cancel() {
        this.dialog.close({ IsOk: false });
    }
}