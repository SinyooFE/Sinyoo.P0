
import { Component, OnInit, AfterViewInit } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { QueryAuthorizeInfo, MyTaskService, TerminologyService } from '../../services';

import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

/*
    Bootstrap模态框——根据则三个值，就可以获取某一条数据的所有字段值
    由mytask-list.component.ts文件传入的三个值：
    conceptId: targetId,
    logId: logId,
    forApproval: toBeApproval
*/
export class ConceptCompareContext extends BSModalContext {
    public logId: number;
    public conceptId: string;
    public forApproval: boolean;
}

/**
 * 概念对比弹窗
 */
@Component({
    selector: 'concept-compare',
    styleUrls: ['mytask-compare.component.css'],
    templateUrl: 'mytask-compare.component.html'
})
export class ConceptCompareDialog implements CloseGuard, OnInit, AfterViewInit, ModalComponent<ConceptCompareContext> {
    //传递过来的数据，并实例化
    context: ConceptCompareContext;
    //旧的的概念类型名
    originalConceptTypeName: string;
    //新的的概念类型名
    currentConceptTypeName: string;
    //概念-旧的值
    originalVal: server.T_ConceptDetailViewModel;
    //概念-新的值
    currentVal: server.T_ConceptDetailViewModel;
    //概念的详情
    logDetail: server.T_ConceptLogViewModel;
    //
    hasApprovePermission: boolean = false;
    conceptId: string = "";
    //评论的意见内容，必须输入才行
    Remark: string;
    //zTree对象
    zTreeObj: any;
    //当前鼠标经过的node对象(addHoverDom的treeNode)
    currentNodeObj: any;
    isAttrChanged: boolean = false;
    isSynomChanged: boolean = false;
    Title: string = "修改";

    constructor(private terminologyService: TerminologyService,
        public dialog: DialogRef<ConceptCompareContext>,
        private myTaskService: MyTaskService,
        public modal: Modal,
        private queryAuthorizeInfo: QueryAuthorizeInfo) {
        this.context = dialog.context;
        //dialog.context.size = 'sm';
        dialog.context.size
        dialog.context.inElement = false;

        dialog.context.dialogClass = "modal-dialog big-modal-dialog";
        dialog.setCloseGuard(this);
        this.Remark = "";

    }


    ngOnInit(): void {
        this.queryAuthorizeInfo.getAuthorizeInfo().then(auth => {
            this.hasApprovePermission = auth.P0_ApproveConcept;
        });
        this.myTaskService
            .getConceptLogById(this.context.conceptId, this.context.logId)
            .subscribe(rep => {
                this.Title = "修改";
                this.logDetail = rep;
                this.Remark = this.logDetail.ProcRemark;

                //初始化这个概念是否有“旧”的值，或者“新”的值
                this.originalVal = rep.OriginalValue ? JSON.parse(rep.OriginalValue) : null;
                this.currentVal = rep.CurrentValue ? JSON.parse(rep.CurrentValue) : null;

                //如果只有旧值或新值,则显示一半大小(即，没有新旧的对比)
                if (this.originalVal == null || this.currentVal == null) {
                    this.dialog.context.dialogClass = "modal-dialog half-modal-dialog ";
                }
                //否则显示 修改前后的对比
                else {
                    this.dialog.context.dialogClass = "modal-dialog big-modal-dialog";
                }
                //如果有“旧”值
                if (this.originalVal !== null) {
                    //如果只有旧数据(没有新数据)
                    if (this.currentVal == null) {
                        this.setTreeData(this.originalVal.ConceptID, this.originalVal.PConceptID, "treeCompareDemo");
                        this.Title = "删除";
                    }
                    this.myTaskService.getConceptTypeName(this.originalVal.ConceptTypeID)
                        .subscribe(name => this.originalConceptTypeName = name);
                    this.conceptId = this.originalVal.ConceptID;
                }
                //如果有“新”值
                if (this.currentVal !== null) {
                    //如果只有新数据
                    if (this.originalVal == null) {
                        this.setTreeData(this.currentVal.ConceptID, this.currentVal.PConceptID, "treeCompareDemo2");
                        this.Title = "新增";
                    }
                    this.myTaskService.getConceptTypeName(this.currentVal.ConceptTypeID)
                        .subscribe(name => this.currentConceptTypeName = name);

                    this.conceptId = this.currentVal.ConceptID;
                }

                //如果都存在，比较同义词和属性
                if (this.currentVal != null && this.originalVal != null) {
                    let a = this.currentVal;
                    let b = this.originalVal;
                    this.isAttrChanged = !_.isEqual(this.currentVal.Attributes, this.originalVal.Attributes);
                    this.isSynomChanged = !_.isEqual(this.currentVal.Synonymes, this.originalVal.Synonymes);
                }
            });
    }
    //在ngAfterViewChecked每次做完组件视图和子视图的变更检测之后调用。 会执行多次
    //ngAfterViewInit初始化完组件视图及其子视图之后调用。只调用一次
    ngAfterViewInit(): void {
        //this.setTreeData();

        ////编辑器
        //$(".summernote").summernote({
        //    lang: 'zh-CN',
        //    minHeight: '250px'
        //});
    }


    setTreeData(id: string, pid: string, elemId: string) {

        this.terminologyService.getConceptSelectedTreeData(id).subscribe(data => {
            console.log(data);

            //初始化树
            var setting = {
                view: {
                    showLine: false,
                    showIcon: false
                },
                edit: {
                    isMove: false,
                    enable: false,
                    showRemoveBtn: false,
                    showRenameBtn: false
                }
            };

            //let RcontHeight = $(".myleft").outerHeight();
            //$(".ztreeL").height(RcontHeight - 15);
            $.fn.zTree.init($(`#${elemId}`), setting, data);

            let zTreeObj = $.fn.zTree.getZTreeObj(elemId);
            let nodes = zTreeObj.getNodesByParam("id", this.conceptId, null);
            zTreeObj.selectNode(nodes[0]);
        });
    }

    approve() {
        //必须收到响应后,才能关闭窗口.否则,列表窗口可能会先拿到审批前的结果
        this.myTaskService
            .approveConcept(this.context.conceptId, this.context.logId, this.Remark)
            .subscribe(data => {
                this.dialog.close({ IsOk: true });
            });

    }

    reject() {
        //必须收到响应后,才能关闭窗口.否则,列表窗口可能会先拿到审批前的结果
        if (this.Remark.trim().length === 0) {//拒绝概念,必须要填写remark
            this.modal.alert()
                .title('警告')
                .message('否决概念,必须提供说明！')
                .okBtn('确定')
                .size('sm')
                .open();
        } else {
            this.myTaskService.rejectConcept(this.context.conceptId, this.context.logId, this.Remark)
                .subscribe(data => {
                    this.dialog.close({ IsOk: true });
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
     * 取消
     */
    cancel() {
        this.dialog.close({ IsOk: false });
    }
}