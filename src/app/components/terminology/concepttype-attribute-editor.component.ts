import { Component, OnInit, AfterViewInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { TerminologyService } from '../../services/terminology';

import { AttributeInputControlType, AttributeType, ConceptDislpayList } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class ConceptTypeAttributeEditorContext extends BSModalContext {
    isAdd: boolean;
    conceptTypeId: string;
    conceptTypeName: string;
    detail: server.T_ConceptTypeAttributeViewModel;
}


@Component({
    // moduleId: module.id,
    selector: 'concepttype-attribute-editor',
    styleUrls: ['concepttype-attribute-editor.component.css'],
    templateUrl: 'concepttype-attribute-editor.component.html'
})

export class ConceptTypeAttributeEditorComponent implements CloseGuard, OnInit, AfterViewInit, ModalComponent<ConceptTypeAttributeEditorContext>  {
    context: ConceptTypeAttributeEditorContext;
    editCommonAttributeValue = '';

    //枚举
    enumAttributeInputControlType = AttributeInputControlType;
    enumAttributeType = AttributeType;
    enumConceptDislpayList = ConceptDislpayList;
    enumControlTypeKeys: string[];
    enumAttributeTypeKeys: string[];

    constructor(public dialog: DialogRef<ConceptTypeAttributeEditorContext>,
        private terminologyService: TerminologyService) {
        dialog.context.size = 'sm';
        dialog.context.inElement = true;
        dialog.setCloseGuard(this);

        this.context = dialog.context;
        this.initData();
    }

    /**
     * 初始化数据
     */
    initData(): void {
        if (this.context.isAdd) {
            this.context.detail = <server.T_ConceptTypeAttributeViewModel>{
                AttributeType: AttributeType.普通属性,
                ControlType: AttributeInputControlType.文本框,
                OptionItems: [],
                RelatedConceptProperties: []
            };
            this.context.detail.ConceptTypeID = this.context.conceptTypeId;
        }

        this.enumControlTypeKeys = Object.keys(this.enumAttributeInputControlType).filter((value) => {
            let tempArray = [AttributeInputControlType.数值, AttributeInputControlType.文本框, AttributeInputControlType.多行文本框,
            AttributeInputControlType.日期录入, AttributeInputControlType.单选, AttributeInputControlType.多选];
            return tempArray.indexOf(parseInt(value)) >= 0;
        });
        this.enumAttributeTypeKeys = Object.keys(this.enumAttributeType).filter((value) => {
            let tempArray = [AttributeType.普通属性, AttributeType.关系属性];
            return tempArray.indexOf(parseInt(value)) >= 0;
        });
    }

    ngOnInit(): void {

    }

    ngAfterViewInit(): void {
        //设置selectpicker
        if (this.context.detail.AttributeType === AttributeType.关系属性) {
            $('.selectpicker').selectpicker('val', this.context.detail.RelatedConceptProperties);
        } else {
            $('.selectpicker').selectpicker('val', '');
        }
    }

    addDropDownOption(optionItem: string, isAdd: boolean): void {
        if (isAdd) {
            this.context.detail.OptionItems.push(optionItem);
        } else {
            _.remove(this.context.detail.OptionItems,
                (item) => {
                    return item === optionItem;
                });
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
        //注意AttributeType数据类型
        if (this.context.detail.AttributeType == AttributeType.关系属性) {
            this.context.detail.RelatedConceptProperties = $('.selectpicker').selectpicker('val');
        }

        if (this.context.detail.AttributeID === undefined
            || this.context.detail.AttributeID === null
            || this.context.detail.AttributeID === '') {
            this.terminologyService.addConceptTypeAttribute(this.context.detail.ConceptTypeID, this.context.detail)
                .subscribe((rep) => {
                    this.dialog.close({ IsOk: true, model: rep });
                });
        } else {
            this.terminologyService
                .updateConceptTypeAttribute(this.context.detail.ConceptTypeID,
                this.context.detail.AttributeID,
                this.context.detail)
                .subscribe((rep) => {
                    this.dialog.close({ IsOk: true, model: rep });
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