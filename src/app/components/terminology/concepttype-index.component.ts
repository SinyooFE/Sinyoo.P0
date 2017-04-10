
import { Component, OnInit, ViewContainerRef} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';

import { Overlay, overlayConfigFactory, DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { Modal, BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { ConceptTypeEditorComponent, ConceptTypeEditorContext } from './concepttype-editor.component';
import { ConceptTypeAttributeEditorComponent, ConceptTypeAttributeEditorContext } from './concepttype-attribute-editor.component';

import { QueryAuthorizeInfo, AuthorizeInfo, TerminologyService } from '../../services';

import { AttributeType } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

@Component({
    // moduleId: module.id,
    selector: 'concepttype-index',
    styleUrls: ['concepttype-index.component.css'],
    templateUrl: 'concepttype-index.component.html'
})

export class ConceptTypeIndexComponent implements CloseGuard, OnInit {
    //当前概念类型
    currentConceptType = <server.T_ConceptTypeViewModel>{};
    //当前概念类型属性
    currentConceptTypeAttributes: Array<server.T_ConceptTypeAttributeViewModel> = [];

    conceptTypeTreeId = 'conceptTypeEditorTree';
    zTreeTypeObj: any;

    //枚举
    enumAttributeType = AttributeType;

    //权限
    authorizeInfo = new AuthorizeInfo();

    constructor(private overlay: Overlay,
        private vcRef: ViewContainerRef,
        private route: ActivatedRoute,
        private location: Location,
        private terminologyService: TerminologyService,
        private queryAuthorizeInfo: QueryAuthorizeInfo,
        public modal: Modal) {

        overlay.defaultViewContainer = vcRef;
    }


    ngOnInit(): void {
        //权限
        this.queryAuthorizeInfo.getAuthorizeInfo().then(auth => {
            this.authorizeInfo = <AuthorizeInfo>auth;
        });
        //初始化类型树
        this.initConceptTypeTree();
    }

    initConceptTypeTree(): void {
        //初始化树
        this.terminologyService.getConceptTypes()
            .subscribe((rep) => {
                //初始化树
                let setting = {
                    view: {
                        showLine: false,
                        showIcon: false,
                        addHoverDom: (treeId, treeNode) => {
                            this.zTreeAddHoverDom(treeId, treeNode);
                        },
                        removeHoverDom: (treeId, treeNode) => {
                            const aObj = $('#' + treeNode.tId + '_a');
                            aObj.find('span[flag="0"]').remove();
                        }
                    },
                    edit: {
                        isMove: false,
                        enable: false,
                        showRemoveBtn: false,
                        showRenameBtn: false
                    },
                    callback: {
                        onClick: (event, treeId, treeNode) => {
                            this.zTreeOnClick(event, treeId, treeNode);
                        }
                    }
                };
                $.fn.zTree.init($(`#${this.conceptTypeTreeId}`), setting, rep);
                this.zTreeTypeObj = $.fn.zTree.getZTreeObj(this.conceptTypeTreeId);
            });
    }

    zTreeAddHoverDom(treeId, treeNode): void {
        const aObj = $('#' + treeNode.tId + '_a');
        const checkLength = aObj.find('span[flag="0"]').length;
        if (checkLength == 0) {
            let addElement = `<span class="button add2-list" title="在下级新增" style="margin-left: 10px;" action="0" flag="0"></span>
                                <span class="button add2" title="在同级新增" action="1" flag="0"></span>
                                <span class="button edit" title="编辑" action="2" flag="0"></span>
                                <span class="button remove" title="删除" action="3" flag="0"></span>`;

            let $addElement = $(addElement);
            aObj.append($addElement);

            aObj.find('span[flag="0"]').off().on('click', (event) => {
                let action = $(event.target).attr('action');

                switch (action) {
                    case '0':
                    case '1':
                    case '2':
                        {
                            this.initCurrentConceptType(treeNode.id).then(() => {
                                this.zTreeTypeObj.selectNode(treeNode);
                            }).then(() => {
                                this.operateConceptType(action);
                            });
                        }; break;
                    case '3':
                        {
                            this.modal.confirm()
                                .title('警告')
                                .message('确定要删除此概念类型吗？')
                                .okBtn('确定')
                                .cancelBtn('取消')
                                .size('sm')
                                .open().then(data => {
                                    data.result.then(ret => {
                                        if (ret) {
                                            //删除
                                            this.terminologyService.deleteConceptType(treeNode.id)
                                                .subscribe(() => {
                                                    this.zTreeTypeObj.removeNode(treeNode, false);
                                                    if (this.currentConceptType.ConceptTypeID === treeNode.id) {
                                                        this.currentConceptType = null;
                                                    }
                                                },(error) => {
                                                    console.log(error);
                                                });
                                        }
                                    }).catch(() => { });
                                });
                        }; break;
                }
                event.stopPropagation();
            });
        }
    }

    zTreeOnClick(event, treeId, treeNode): void {
        this.initCurrentConceptType(treeNode.id);
    }

    /**
     * 初始化当前选中的概念详情和属性
     * @param conceptTypeId
     */
    initCurrentConceptType(conceptTypeId: string) {
        return new Promise<Boolean>((resolve, reject) => {
            if (this.currentConceptType === null
                || this.currentConceptTypeAttributes === null
                || this.currentConceptType.ConceptTypeID !== conceptTypeId) {
                this.terminologyService.getConceptType(conceptTypeId)
                    .subscribe((data) => {
                        this.currentConceptType = data;

                        this.terminologyService.getConceptTypeAttributes(conceptTypeId)
                            .subscribe((data) => {
                                this.currentConceptTypeAttributes = data;
                                resolve();
                            });
                    });
            } else {
                resolve();
            }
        });
    }

    /**
     * 操作概念类型，添加、修改
     * @param action 等于-1时，查看
     */
    operateConceptType(action): void {
        //-1查看
        if (action === '-1') return;
        this.modal
            .open(ConceptTypeEditorComponent, overlayConfigFactory(<ConceptTypeEditorContext>{
                action: action,
                selectedTypeDetail: this.currentConceptType
            }, BSModalContext))
            .then(data => {
                data.result.then(ret => {
                    console.log(ret);

                    if (ret.IsOk) {
                        if (ret.model !== undefined && ret.model !== null) {
                            if (action === '0' || action === '1') {
                                let parentNode = null;
                                if (ret.model.PConceptTypeID != null &&
                                    ret.model.PConceptTypeID != '') {
                                    parentNode = this.zTreeTypeObj
                                        .getNodeByParam('id', ret.model.PConceptTypeID);
                                }
                                let addNode = {
                                    id: ret.model.ConceptTypeID,
                                    name: ret.model.ConceptTypeName,
                                    open: false,
                                    PConceptTypeID: ret.model.PConceptTypeID,
                                    children: []
                                };
                                this.zTreeTypeObj.addNodes(parentNode, -1, addNode);
                            } else {
                                let currentNode = this.zTreeTypeObj.getNodesByFilter((node) => {
                                    return node.id === ret.model.ConceptTypeID;
                                }, true);

                                if (currentNode != null) {
                                    currentNode.name = ret.model.ConceptTypeName;
                                    this.zTreeTypeObj.updateNode(currentNode, false);
                                }
                            }
                        }
                    }
                });
            });
    }

    /**
     * 操作属性，添加、修改
     * @param isAdd
     * @param detail
     */
    operateConceptTypeAttribute(isAdd: boolean, detail: server.T_ConceptTypeAttributeViewModel = null): void {
        if (isAdd &&
        (this.currentConceptType.ConceptTypeID === undefined ||
            this.currentConceptType.ConceptTypeID === null ||
            this.currentConceptType.ConceptTypeID === '')) {
            this.modal.alert()
                .title('提示')
                .message('请选择概念类型！')
                .okBtn('确定')
                .size('sm')
                .open();
            return;
        }

        this.modal.open(ConceptTypeAttributeEditorComponent,
            overlayConfigFactory(<ConceptTypeAttributeEditorContext>{
                isAdd: isAdd,
                conceptTypeId: this.currentConceptType.ConceptTypeID,
                conceptTypeName: this.currentConceptType.ConceptTypeName,
                detail: detail
            }, BSModalContext))
            .then(data => {
                data.result.then(ret => {
                    if (ret.IsOk) {
                        if (ret.model !== undefined && ret.model !== null) {
                            if (isAdd) {
                                this.currentConceptTypeAttributes.push(<server.T_ConceptTypeAttributeViewModel>ret.model);
                            } else {
                                var tempIndex = _.findIndex(this.currentConceptTypeAttributes, (item) => {
                                    return item.AttributeID === ret.model.AttributeID;
                                });
                                if (tempIndex > -1 && tempIndex < this.currentConceptTypeAttributes.length) {
                                    this.currentConceptTypeAttributes[tempIndex] = ret.model;
                                }
                            }
                        }
                    }
                });
            });
    }

    /**
     * 删除属性
     * @param attribute
     */
    deleteConceptTypeAttribute(attribute: server.T_ConceptTypeAttributeViewModel): void {
        this.modal.confirm()
            .title('警告')
            .message('确定删除吗？')
            .okBtn('确定')
            .cancelBtn('取消')
            .size('sm')
            .open().then(data => {
                data.result.then(ret => {
                    if (ret) {
                        this.terminologyService
                            .deleteConceptTypeAttribute(attribute.ConceptTypeID, attribute.AttributeID)
                            .subscribe((data) => {
                                _.remove(this.currentConceptTypeAttributes,
                                    (item) => {
                                        return item.AttributeID === attribute.AttributeID;
                                    });
                            });
                    }
                }).catch(() => { });
            });
    }
}