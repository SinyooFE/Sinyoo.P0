/**
* 域列表组件
*/

import { Component, OnInit, AfterViewInit, Input, Output, ViewChild, EventEmitter, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { Overlay, overlayConfigFactory } from 'angular2-modal';
import { Modal, BSModalContext } from 'angular2-modal/plugins/bootstrap';

import { DomainEditorComponent } from './domain-editor.component';
import { DomainCopyComponent } from './domain-copy.component';
import { VariableEditorComponent } from './variable-editor.component';

import { StandardService, BaseService } from '../../services';

import { SelectedFieldInfo, LocalStorageStandardModel } from '../../models';

import { ApprovalStatus, DataStatus } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

@Component({
    // moduleId: module.id,
    selector: 'domain-list',
    styleUrls: ['domain-list.component.css'],
    templateUrl: 'domain-list.component.html'
})

export class DomainListComponent implements OnInit, AfterViewInit {
    currentDomain = <server.S_DomainViewModel>{};
    @Input() standard = <server.S_StandardViewModel>{};
    @Output() reportDomain = new EventEmitter<server.S_DomainViewModel>();

    private domainList: server.S_DomainViewModel[];

    //排序
    @ViewChild('domainListDiv') domainListDiv;

    //枚举
    enumApprovalStatus = ApprovalStatus;
    enumDataStatus = DataStatus;

    editorHeight = 0;

    constructor(private router: Router,
        private overlay: Overlay,
        private vcRef: ViewContainerRef,
        private standardService: StandardService,
        private baseService: BaseService,
        public modal: Modal) {
        overlay.defaultViewContainer = vcRef;
    }

    ngOnInit(): void {

    }

    ngAfterViewInit(): void {
        this.baseService.contentHeight.debounceTime(500)
            .distinctUntilChanged()
            .subscribe((data) => {
                this.editorHeight = data - 180;
            });

        if (this.domainListDiv !== null) {
            $(this.domainListDiv.nativeElement).sortable({
                items: '>div',
                update: (event, ui) => {
                    //当前拖动对象
                    let tempDomainDetail = <server.S_DomainDetailViewModel>{
                        ID: +ui.item.data('id'),
                        Sort: +ui.item.data('sort')
                    };

                    //当前排序信息
                    let tempDomainDetailArray = [];
                    $(event.target).find('>div').each((index, item) => {
                        tempDomainDetailArray.push({
                            ID: +$(item).data('id'),
                            Sort: +$(item).data('sort')
                        });
                    });
                    //当前拖动对象的新下标
                    let tempDomainDetailIndex = _.findIndex(tempDomainDetailArray,
                        (item) => {
                            return item.ID === tempDomainDetail.ID;
                        });
                    //计算排序值
                    if (tempDomainDetailIndex > -1
                        && tempDomainDetailIndex < tempDomainDetailArray.length
                        && tempDomainDetailArray.length > 1) {
                        if (tempDomainDetailIndex === 0) {
                            tempDomainDetail.Sort = tempDomainDetailArray[tempDomainDetailIndex + 1].Sort / 2.0;
                        } else if (tempDomainDetailIndex === tempDomainDetailArray.length - 1) {
                            tempDomainDetail.Sort = tempDomainDetailArray[tempDomainDetailIndex - 1].Sort + 10;
                        } else {
                            tempDomainDetail.Sort = (tempDomainDetailArray[tempDomainDetailIndex + 1].Sort + tempDomainDetailArray[tempDomainDetailIndex - 1].Sort) / 2.0;
                        }
                    }
                    //更新排序
                    this.standardService.saveDomainDetail(this.standard.ID, tempDomainDetail)
                        .subscribe((data) => {
                            let tempIndex = _.findIndex(this.domainList,
                                (item) => { return item.ID === tempDomainDetail.ID });
                            if (tempIndex > -1 && tempIndex < this.domainList.length) {
                                //改变排序值
                                this.domainList[tempIndex].Sort = data.Sort;
                                this.domainList = _.sortBy(this.domainList, (item) => { return item.Sort });
                            }
                        });
                }
            });
        }
    }

    changeDomain(domain: server.S_DomainViewModel) {
        this.currentDomain = domain;
        this.reportDomain.emit(this.currentDomain);
    }

    /**
     * 根据标准ID更新域
     * @param standard
     */
    updateStandard(standard) {
        this.standard = standard;

        if (!_.isNil(this.standard)) {
            this.standardService.getDomainList(this.standard.ID)
                .subscribe(
                (data) => {
                    this.domainList = data;

                    if (_.isNil(this.domainList) === false && this.domainList.length > 0) {
                        let tempDomain: server.S_DomainViewModel;

                        let lsModel = this.standardService.getLastStandardInfo();
                        if (!_.isNil(lsModel)) {
                            //如果存在于当前域列表，则加载此域
                            let tempIndex = _.findIndex(this.domainList,
                                (item) => { return item.ID === lsModel.domain.ID; });
                            if (tempIndex > -1) {
                                tempDomain = lsModel.domain;
                            }
                        }
                        this.changeDomain(_.isNil(tempDomain) ? this.domainList[0] : tempDomain);
                    } else {
                        this.changeDomain(null);
                    }
                });
        } else {
            this.domainList = [];
        }
    }

    /**
     * 创建新域
     */
    createDomain() {
        //console.log(this.standard);

        if (_.isNil(this.standard)) {
            this.showAlert('请先选择一个标准！', 1);
            return;
        }

        this.modal
            .open(DomainEditorComponent, overlayConfigFactory({
                isAdd: true,
                standardId: this.standard.ID,
                domainId: null,
                domainList: this.domainList
            }, BSModalContext))
            .then(data => {
                data.result.then(ret => {
                    data.result.then(ret => {
                        if (ret.IsOk) {
                            if (ret.Model !== undefined && ret.Model !== null) {
                                this.showAlert('添加成功！');
                                this.updateDomainList(<server.S_DomainDetailViewModel>ret.Model, 1);
                            }
                        }
                    });
                });
            });
    }

    /**
     * 复制域
     */
    copyDomain() {
        if (_.isNil(this.standard)) {
            this.showAlert('请先选择一个概念！', 1);
            return;
        }

        this.modal
            .open(DomainCopyComponent, overlayConfigFactory({
                isCopyDomain: true,
                standardId: this.standard.ID
            }, BSModalContext))
            .then(data => {
                data.result.then(ret => {
                    if (ret.IsOk) {
                        if (!_.isNil(ret.model)) {
                            this.showAlert('复制域成功！');
                            //ret.model为复制的新域信息,为数组
                            this.domainList = this.domainList.concat(ret.model as Array<server.S_DomainViewModel>);
                        }
                    }
                });
            });
    }

    /**
     * 创建变量
     */
    createVariable(domainId: number) {
        this.router.navigate([`/standard/variableedit/${this.standard.ID}/${domainId}/0`]);
    }

    /**
     * 复制变量
     */
    copyVariable(domainId: number, domainName: string) {
        return this.modal
            .open(DomainCopyComponent, overlayConfigFactory({
                isCopyDomain: false,
                standardId: this.standard.ID,
                domainId: domainId
            }, BSModalContext))
            .then(data => {
                data.result.then(ret => {
                    if (ret.IsOk) {
                        if (!_.isNil(ret.model)) {
                            this.showAlert('复制变量成功！');
                            //ret.model为多个变量信息
                            if (this.currentDomain.ID === domainId) {
                                this.changeDomain(this.currentDomain);
                            }
                        }
                    }
                }).catch(() => { });
            });
    }

    /**
     * 编辑域
     */
    editDomain(id: number) {
        this.router.navigate([`/standard/domainedit/${this.standard.ID}/${id}`]);
    }

    /**
     * 删除域
     */
    deleteDomain(domainId: number) {
        this.modal.confirm()
            .title('警告')
            .message('确定要删除此标准吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open().then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.standardService.deleteDomain(this.standard.ID, domainId)
                            .subscribe(
                            (data) => {
                                if (data.IsDeleted) {
                                    this.updateDomainList(<server.S_DomainDetailViewModel>{ ID: domainId }, 3);
                                    if (this.currentDomain.ID === domainId) {
                                        //删除后默认显示第一条数据
                                        if (this.domainList.length > 0) {
                                            this.changeDomain(this.domainList[0]);
                                        } else {
                                            this.changeDomain(null);
                                        }
                                    }
                                } else {
                                    let tempDomain = _.find(this.domainList, (item) => { return item.ID === domainId });
                                    if (!_.isNil(tempDomain)) {
                                        tempDomain.DataStatus = data.Status;
                                        tempDomain.ApprovedStatus = data.ApprovedStatus;
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
    undoDeleteDomain(domainId: number) {
        this.modal.confirm()
            .title('警告')
            .message('确定要取消删除此标准吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open().then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.standardService.undoDeleteDomain(this.standard.ID, domainId)
                            .subscribe(
                            (data) => {
                                let tempDomain = _
                                    .find(this.domainList, (item) => { return item.ID === domainId });
                                if (!_.isNil(tempDomain)) {
                                    tempDomain.DataStatus = data.Status;
                                    tempDomain.ApprovedStatus = data.ApprovedStatus;
                                }
                            });
                    }
                }).catch(() => { });
            });
    }

    /**
     * 更新域列表
     * @param domain
     * @param opt 1添加，2修改，3删除
     */
    updateDomainList(domain: server.S_DomainDetailViewModel, opt: number): void {
        let tempDomain = <server.S_DomainViewModel>{};

        switch (opt) {
            case 1:
                {
                    tempDomain.ID = domain.ID;
                    tempDomain.StandardID = domain.StandardID;
                    tempDomain.DomainName = domain.DomainName;
                    tempDomain.Sort = domain.Sort;
                    tempDomain.FieldsCount = 0;
                    tempDomain.ApprovedStatus = domain.ApprovedStatus;
                    tempDomain.IsOwner = domain.IsOwner;

                    this.domainList.push(tempDomain);
                }; break;
            case 2:
                {
                    tempDomain.ID = domain.ID;
                    tempDomain.StandardID = domain.StandardID;
                    tempDomain.DomainName = domain.DomainName;
                    tempDomain.Sort = domain.Sort;
                    tempDomain.ApprovedStatus = domain.ApprovedStatus;
                    tempDomain.IsOwner = domain.IsOwner;

                    let index = _.findIndex(this.domainList,
                        (item) => {
                            return item.ID === domain.ID;
                        });

                    if (index > -1 && index < this.domainList.length) {
                        this.domainList[index] = tempDomain;
                    }
                }; break;
            case 3:
                {
                    _.remove(this.domainList, p => p.ID === domain.ID);
                }; break;
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

    /**
     * 提示框
     * @param message
     * @param type
     */
    showAlert(message: string, type = 0): void {
        this.modal.alert()
            .title(type == 0 ? '提示' : '警告')
            .message(message)
            .okBtn('确定')
            .size('sm')
            .open();
    }
}