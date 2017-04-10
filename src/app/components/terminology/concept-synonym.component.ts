import { Component, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { TerminologyService } from '../../services/terminology';

import { SynonymType } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class ConceptSynonymContext extends BSModalContext {
    /**
     * 是否添加
     * 必须
     */
    isAdd: boolean;
    /**
     * 类型
     */
    synonymType: SynonymType;
    /**
     * 已添加的同义词和正则表达式
     * 必需
     */
    synonyms: Array<server.T_SynonymDetailViewModel>;
    /**
     * 概念ID
     */
    conceptId: string;
    /**
     * 概念名称
     */
    conceptName: string;
    /**
     * 序号，编辑时必须
     */
    curIndex: number;
    /**
     * 非必须，用于绑定
     */
    curSynonym: server.T_SynonymDetailViewModel;
}

@Component({
    // moduleId: module.id,
    selector: 'concept-synonym',
    styleUrls: ['concept-synonym.component.css'],
    templateUrl: 'concept-synonym.component.html'
})

export class ConceptSynonymComponent implements CloseGuard, OnInit, ModalComponent<ConceptSynonymContext>  {
    context: ConceptSynonymContext;

    //枚举
    enumSynonymType = SynonymType;

    constructor(public dialog: DialogRef<ConceptSynonymContext>,
        public modal: Modal,
        private terminologyService: TerminologyService) {
        dialog.context.inElement = true;
        dialog.setCloseGuard(this);
        this.context = dialog.context;

        this.initData();
    }

    /**
     * 初始化数据
     */
    initData(): void {
        //设置当前curSynonym
        if (this.context.isAdd) {
            this.context.curSynonym = <server.T_SynonymDetailViewModel>{
                ConceptID: this.context.conceptId,
                SynonymType: this.context.synonymType
            };
        } else {
            if (this.context.curIndex > -1 && this.context.curIndex < this.context.synonyms.length) {
                this.context.curSynonym = _.cloneDeep(this.context.synonyms[this.context.curIndex]);
                //保持一致
                this.context.synonymType = this.context.curSynonym.SynonymType;
            }
        }

        console.log(this.context);
    }

    ngOnInit(): void {

    }

    getSynonymTypeList(): server.T_SynonymDetailViewModel[] {
        return this.context.synonyms.filter((item) => {
            return item.SynonymType === this.context.curSynonym.SynonymType;
        }); 
    }

    /**
     * 检查是否含有同名
     */
    checkHaveSameName(): boolean {
        return _.findIndex(this.context.synonyms, (item, index) => {
            return (item.SynonymName === this.context.curSynonym.SynonymName &&
                item.SynonymType === this.context.curSynonym.SynonymType &&
                index !== this.context.curIndex);
        }) > -1;
    }

    /**
     * 拼音
     * @param value
     */
    setPinyin(value: string): string {
        return pinyinUtil.getFirstLetter(value);
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
        if (!this.checkHaveSameName()) {
            this.context.curSynonym.SynonymNamePy = this.setPinyin(this.context.curSynonym.SynonymName);
            this.dialog.close({ IsOk: true, model: this.context.curSynonym, index: this.context.curIndex });
        } else {
            this.modal.alert()
                .title('警告')
                .message(`已存在相同的${SynonymType[this.context.curSynonym.SynonymType]}！`)
                .okBtn('确定')
                .size('sm')
                .open();
        }
    }

    /**
     * 取消
     */
    cancel() {
        this.dialog.close({ IsOk: false });
    }
}