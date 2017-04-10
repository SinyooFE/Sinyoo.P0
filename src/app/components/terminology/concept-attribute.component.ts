import { Component, OnInit, AfterViewInit, ViewContainerRef, ViewEncapsulation, ViewChild } from '@angular/core';

import { DialogRef, ModalComponent, CloseGuard } from 'angular2-modal';
import { BSModalContext, BootstrapModalSize } from 'angular2-modal/plugins/bootstrap';

import { TerminologyService } from '../../services/terminology';

import { AttributeType, AttributeInputControlType, ConceptDislpayList } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

export class ConceptAttributeContext extends BSModalContext {
    curIndex: number;
    attributes: Array<server.T_AttributeViewModel>;
    curAttribute: server.T_AttributeViewModel;
}

@Component({
    // moduleId: module.id,
    selector: 'concept-attribute',
    styleUrls: ['concept-attribute.component.css'],
    templateUrl: 'concept-attribute.component.html'
})

export class ConceptAttributeComponent implements CloseGuard, OnInit, AfterViewInit, ModalComponent<ConceptAttributeContext>  {
    context: ConceptAttributeContext;
    selectedConceptName = '';

    //概念树相关
    conceptTreeId = 'conceptAttributeConceptTree';
    zTreeObj: any;

    //枚举
    enumAttributeType = AttributeType;
    enumAttributeInputControlType = AttributeInputControlType;

    //下拉框
    @ViewChild('dropDownTrigger') dropDownTrigger;

    constructor(public dialog: DialogRef<ConceptAttributeContext>, private terminologyService: TerminologyService) {
        dialog.context.size = 'sm';
        dialog.context.inElement = true;
        dialog.setCloseGuard(this);
        this.context = dialog.context;

        //console.log(this.context);
        this.initData();
    }

    /**
     * 初始化数据
     */
    initData(): void {
        if (this.context.curIndex > -1 && this.context.curIndex < this.context.attributes.length) {
            this.context.curAttribute = _.cloneDeep(this.context.attributes[this.context.curIndex]);
        }
        console.log(this.context.curAttribute);
    }

    ngOnInit(): void {

    }

    ngAfterViewInit(): void {
        this.setConceptTree();

        //设置selectpicker
        if (this.context.curAttribute.AttributeType === AttributeType.普通属性) {
            let selectedItem = [];
            _.map(this.context.curAttribute.OptionItems,
                (item) => {
                    if ((`,${this.context.curAttribute.AttributeValue},`).indexOf(`,${item},`) > -1) {
                        selectedItem.push(item);
                    }
                });
            $('.selectpicker').selectpicker('val', selectedItem);
        }

        //下拉框
        if (this.dropDownTrigger != null) {
            let eventTarget = $(this.dropDownTrigger.nativeElement);
            eventTarget.on({
                click: (event) => {
                    if (eventTarget.parent().hasClass('open')) {
                        eventTarget.find('i').html('&#xe6b6;');
                        eventTarget.parent().removeClass('open');
                        $('body').off('click.dropdown');
                    } else {
                        eventTarget.find('i').html('&#xe65d;');
                        eventTarget.parent().addClass('open');

                        $('body').on('click.dropdown', (e) => {
                            if (!eventTarget.next('div').is(e.target)
                                && eventTarget.next('div').has(e.target).length === 0
                                && eventTarget.parent().has(e.target).length === 0) {
                                eventTarget.find('i').html('&#xe6b6;');
                                eventTarget.parent().removeClass('open');
                                $('body').off('click.dropdown');
                            }
                        });
                    }
                    event.stopPropagation();
                }
            });
        }
    }

    /**
     * 设置概念树
     */
    setConceptTree(): void {
        //展开到制定节点
        let explandedIds = '';
        this.context.curAttribute.RelatedConceptIDs.forEach((item) => {
            explandedIds += `${item},`;
        });
        explandedIds = _.trimEnd(explandedIds, ',');

        this.terminologyService.getConceptSelectedTreeData(explandedIds)
            .subscribe((rep) => {
                let setting = {
                    view: {
                        showLine: false,
                        showIcon: false
                    },
                    edit: {
                        isMove: false,
                        enable: false,
                        showRemoveBtn: false,
                        showRenameBtn: false
                    },
                    check: {
                        enable: this.context.curAttribute.IsMulti,
                        chkboxType: { "Y": '', "N": '' }
                    },
                    callback: {
                        onExpand: (event, treeId, treeNode) => {
                            if (!treeNode.isExpanded) {
                                this.terminologyService.getConceptTreeData(treeNode.id)
                                    .subscribe((rep) => {
                                        if (rep === null || rep === undefined || rep.length === 0) {
                                            treeNode.isParent = false;
                                        } else {
                                            this.zTreeObj.addNodes(treeNode, rep, false);
                                        }
                                        treeNode.isExpanded = true;
                                    });
                            }
                        },
                        onClick: (event, treeId, treeNode) => {
                            if (this.context.curAttribute.IsMulti) {
                                this.zTreeObj.checkNode(treeNode, !treeNode.checked, false, true);
                            } else {
                                this.context.curAttribute.RelatedConceptIDs = [treeNode.id];
                                this.setSelectedConceptName();
                            }
                        },
                        onCheck: (event, treeId, treeNode) => {
                            //this.context.curAttribute.IsMulti == false时不会执行
                            //console.log(123);
                            if (!treeNode.checked) {
                                _.remove(this.context.curAttribute.RelatedConceptIDs,
                                    (item) => {
                                        return item === treeNode.id;
                                    });
                            } else {
                                this.context.curAttribute.RelatedConceptIDs.push(treeNode.id);
                            }
                            this.setSelectedConceptName();
                        }
                    }
                };
                $.fn.zTree.init($(`#${this.conceptTreeId}`), setting, rep);
                this.zTreeObj = $.fn.zTree.getZTreeObj(this.conceptTreeId);

                //编辑时初始化显示名称
                this.setSelectedConceptName();
            });
    }

    /**
     * 设置当前选中的概念名称
     */
    setSelectedConceptName(): void {
        if (this.zTreeObj != null) {
            //获取所应该选中的节点
            let selectedNodes: Array<any> = this.zTreeObj.getNodesByFilter((node) => {
                return this.context.curAttribute.RelatedConceptIDs.indexOf(node.id) > -1;
            }, false);

            let tempName = '';
            if (selectedNodes != null && selectedNodes.length > 0) {
                if (this.context.curAttribute.IsMulti) {
                    selectedNodes.forEach((itemNode) => {
                        tempName += `${itemNode.name},`;
                        this.zTreeObj.checkNode(itemNode, true, false, false);
                    });
                } else {
                    tempName += `${selectedNodes[0].name},`;
                    this.zTreeObj.selectNode(selectedNodes[0], false, true);
                }
            }
            this.selectedConceptName = _.trimEnd(tempName, ',');
        }
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
        //设置AttributeValue
        if (this.context.curAttribute.AttributeType == AttributeType.普通属性) {
            if (this.context.curAttribute.ControlType == AttributeInputControlType.多选) {
                let tempSelectedItem = $('.selectpicker').selectpicker('val');
                if (!_.isNil(tempSelectedItem) && tempSelectedItem !== '') {
                    let tempRes = '';
                    tempSelectedItem.forEach((value, index, array) => {
                        tempRes += (tempRes === '') ? value : `,${value}`;
                    });
                    this.context.curAttribute.AttributeValue = tempRes;
                }
            }
        } else if (this.context.curAttribute.AttributeType == AttributeType.关系属性) {
            let tempValue = '';
            this.context.curAttribute.RelatedConceptIDs.forEach((valueConcept, indexConcept) => {
                let tempNode = this.zTreeObj.getNodeByParam('id', valueConcept, null);
                if (tempNode != null) {
                    //debugger;
                    //console.log(tempNode);
                    //console.log(this.context.curAttribute.ConceptTypeAttribute);
                    this.context.curAttribute.RelatedConceptProperties.forEach((valueProperty, indexProperty) => {
                        let tempResults = '';
                        switch (parseInt(valueProperty)) {
                            case ConceptDislpayList.概念中文名称:
                                {
                                    tempResults = tempNode.name; //tempNode.ConceptName
                                }; break;
                            case ConceptDislpayList.概念编码:
                                {
                                    tempResults = tempNode.ConceptCode;
                                }; break;
                            case ConceptDislpayList.概念英文名称:
                                {
                                    tempResults = tempNode.ConceptNameEn;
                                }; break;
                            case ConceptDislpayList.缩写:
                                {
                                    tempResults = tempNode.ConceptNameAb;
                                }; break;
                            case ConceptDislpayList.概念首字母:
                                {
                                    tempResults = tempNode.ConceptNamePy;
                                }; break;
                        }
                        console.log(tempResults);
                        if (!_.isNil(tempResults) && tempResults !== '') {
                            tempValue += (tempValue === '') ? tempResults : `,${tempResults}`;
                        }
                    });
                }
            });
            this.context.curAttribute.AttributeValue = tempValue;
        }

        console.log(this.context.curAttribute);
        this.dialog.close({ IsOk: true, model: this.context.curAttribute, index: this.context.curIndex });
    }

    /**
     * 取消
     */
    cancel() {
        this.dialog.close({ IsOk: false });
    }


}