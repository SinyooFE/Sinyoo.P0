/**
* 标准列表组件
*/
import { Component, OnInit, AfterViewInit, Output, EventEmitter, ViewChild, ViewContainerRef } from '@angular/core';

import { Router } from '@angular/router';

import { overlayConfigFactory } from 'angular2-modal';
import { Modal, BSModalContext } from 'angular2-modal/plugins/bootstrap';

import { StandardEditorComponent } from './standard-editor.component';
import { StandardCopyComponent } from './standard-copy.component';

import { StandardService, BaseService } from '../../services';
import { LocalStorageStandardModel } from '../../models';

import { ApprovalStatus, DataStatus } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

@Component({
    // moduleId: module.id,
    selector: 'standard-list',
    styleUrls: ['standard-list.component.css'],
    templateUrl: 'standard-list.component.html'
})
export class StandardListComponent implements OnInit, AfterViewInit {
    @Output() reportStandard = new EventEmitter<server.S_StandardViewModel>();
    private standardList: Array<server.S_StandardViewModel> = [];
    private currentStandard = <server.S_StandardViewModel>{};

    //列表容器
    //@ViewChild('standardListDiv') standardListDiv;

    //枚举
    enumApprovalStatus = ApprovalStatus;
    enumDataStatus = DataStatus;

    editorHeight = 0;

    constructor(private router: Router,
        private vcRef: ViewContainerRef,
        private standardService: StandardService,
        private baseService: BaseService,
        private modal: Modal) {
        modal.overlay.defaultViewContainer = vcRef;
    }

    ngOnInit(): void {
        this.standardService.getStandardList()
            .subscribe(
            (data) => {
                this.standardList = data;

                //默认显示上次操作的标准
                if (this.standardList.length > 0) {
                    let tempStandard: server.S_StandardViewModel;
                    let lsModel = this.standardService.getLastStandardInfo();
                    if (!_.isNil(lsModel)) {
                        //如果存在于当前标准列表，则加载此标准
                        let tempIndex = _.findIndex(this.standardList,
                            (item) => { return item.ID === lsModel.standard.ID; });
                        if (tempIndex > -1) {
                            tempStandard = lsModel.standard;
                        }
                    }
                    this.selectStandard(_.isNil(tempStandard) ? this.standardList[0] : tempStandard);
                }
            });
    }

    ngAfterViewInit(): void {
        this.baseService.contentHeight.debounceTime(500)
            .distinctUntilChanged()
            .subscribe((data) => {
                this.editorHeight = data - 180;
            });

        //标准不需要拖动排序
        //Modify by DL 20170119
        //if (this.standardListDiv !== null) {
        //    $(this.standardListDiv.nativeElement).find('table').sortable({
        //        items: 'tr',
        //        update: (event, ui) => {
        //            //当前拖动对象
        //            let tempStandardDetail = <server.S_StandardDetailViewModel>{
        //                ID: +ui.item.data('id'),
        //                Sort: +ui.item.data('sort')
        //            };
        //            //当前排序信息
        //            let tempStandardDetailArray = [];
        //            $(event.target).find('tr').each((index, item) => {
        //                tempStandardDetailArray.push({
        //                    ID: +$(item).data('id'),
        //                    Sort: +$(item).data('sort')
        //                });
        //            });
        //            //当前拖动对象的新下标
        //            let tempStandardDetailIndex = _.findIndex(tempStandardDetailArray,
        //                (item) => {
        //                    return item.ID === tempStandardDetail.ID;
        //                });
        //            //计算排序值
        //            if (tempStandardDetailIndex > -1
        //                && tempStandardDetailIndex < tempStandardDetailArray.length
        //                && tempStandardDetailArray.length > 1) {
        //                if (tempStandardDetailIndex === 0) {
        //                    tempStandardDetail.Sort = tempStandardDetailArray[tempStandardDetailIndex + 1].Sort / 2.0;
        //                } else if (tempStandardDetailIndex === tempStandardDetailArray.length - 1) {
        //                    tempStandardDetail.Sort = tempStandardDetailArray[tempStandardDetailIndex - 1].Sort + 10;
        //                } else {
        //                    tempStandardDetail.Sort = (tempStandardDetailArray[tempStandardDetailIndex + 1].Sort + tempStandardDetailArray[tempStandardDetailIndex - 1].Sort) / 2.0;
        //                }
        //            }
        //            //更新排序
        //            this.standardService.saveStandard(tempStandardDetail)
        //                .subscribe((data) => {
        //                    let tempIndex = _.findIndex(this.standardList,
        //                        (item) => {
        //                            return item.ID === tempStandardDetail.ID;
        //                        });
        //                    if (tempIndex > -1 && tempIndex < this.standardList.length) {
        //                        this.standardList[tempIndex].Sort = data.Sort;
        //                        this.standardList = _.sortBy(this.standardList, (item) => { return item.Sort });
        //                    }
        //                });
        //        }
        //    });
        //}
    }

    /**
     * 选择当前标准
     * @param id
     */
    selectStandard(standard: server.S_StandardViewModel) {
        this.currentStandard = standard;
        this.reportStandard.emit(this.currentStandard);
    }

    /**
     * 创建新标准
     */
    creatStandard() {
        this.modal
            .open(StandardEditorComponent, overlayConfigFactory({ isAdd: true, standardId: null, standardList: this.standardList }, BSModalContext))
            .then(data => {
                data.result.then(ret => {
                    if (ret.IsOk) {
                        if (ret.model !== undefined && ret.model !== null) {
                            this.modal.alert()
                                .title('提示')
                                .message('添加成功！')
                                .okBtn('确定')
                                .size('sm')
                                .open();

                            this.standardList.push(<server.S_StandardViewModel>ret.model);
                        }
                    }
                });
            });
    }

    /**
     * 编辑标准
     */
    editStandard(id: number) {
        this.router.navigate([`/standard/standardedit/${id}`]);
    }

    /**
     * 更新数据
     */
    private refreshData() {
        this.standardService.getStandardList()
            .subscribe(
            (data) => {
                this.standardList = data;
            },
            (error) => {
                console.log(error);
            },
            () => {
                console.log("complete");
            });
    }

    /**
     * 复制标准
     */
    copyStandard() {
        return this.modal
            .open(StandardCopyComponent, overlayConfigFactory({ isAdd: true, standardId: null }, BSModalContext))
            .then(data => {
                data.result.then(ret => {
                    if (ret.IsOk) {
                        if (ret.model !== undefined && ret.model !== null) {
                            this.standardList.push(<server.S_StandardViewModel>ret.model);

                            this.modal.alert()
                                .title('提示')
                                .message('复制成功！')
                                .okBtn('确定')
                                .size('sm')
                                .open();
                        }
                    }
                });
            });
    }

    /**
     * 删除标准
     */
    deleteStandard(id: number) {
        this.modal.confirm()
            .title('警告')
            .message('确定要删除此标准吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open().then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.standardService.deleteStandard(id)
                            .subscribe(
                            (data) => {
                                if (data.IsDeleted) {
                                    _.remove(this.standardList, p => p.ID === id);
                                    //删除标准后，更新选中的标准
                                    if (this.currentStandard.ID === id) {
                                        //删除后默认显示第一条数据
                                        if (this.standardList.length > 0) {
                                            this.selectStandard(this.standardList[0]);
                                        } else {
                                            this.selectStandard(null);
                                        }
                                    }
                                } else {
                                    let tempStandard = _.find(this.standardList, (item) => { return item.ID === id });
                                    if (!_.isNil(tempStandard)) {
                                        tempStandard.DataStatus = data.Status;
                                        tempStandard.ApprovedStatus = data.ApprovedStatus;
                                    }
                                }
                            });
                    }
                }).catch(() => {

                });
            });
    }

    /**
     * 取消删除
     */
    undoDeleteStandard(id: number) {
        this.modal.confirm()
            .title('警告')
            .message('确定要取消删除此标准吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open().then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.standardService.undoDeleteStandard(id)
                            .subscribe(
                            (data) => {
                                console.log(data);
                                let tempStandard = _.find(this.standardList, (item) => { return item.ID === id });
                                if (!_.isNil(tempStandard)) {
                                    tempStandard.DataStatus = data.Status;
                                    tempStandard.ApprovedStatus = data.ApprovedStatus;
                                }
                            });
                    }
                }).catch(() => { });
            });
    }

    /**
     * 提交标准后调用，主要用于更改状态
     * 暂时写死，后面API返回真实结果后修改
     */
    afterSubmitStandard(id: number) {
        let tempStandard = _.find(this.standardList, (item) => { return item.ID === id });
        if (!_.isNil(tempStandard)) {
            tempStandard.ApprovedStatus = ApprovalStatus.待审核;
        }
    }

    /**
     * 状态标记
     * @param status
     */
    iconFontHtml(status: ApprovalStatus): string {
        let res = '';
        switch (status) {
            case ApprovalStatus.未提交:
                {
                    res = "&#xe617;";
                }; break;
            case ApprovalStatus.审核通过:
                {
                    res = "&#xe6a9;";
                }; break;
            case ApprovalStatus.审核未通过:
                {
                    res = "&#xe71d;";
                }; break;
            default:
                {
                    res = "&#xe868;";
                }; break;
        }
        return res;
    }
}