/**
* Mapping入口界面
*/

import { Component, OnInit, ViewContainerRef, ViewEncapsulation, Inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

import { PageScrollService, PageScrollInstance } from 'ng2-page-scroll';
import { DOCUMENT } from '@angular/platform-browser';

import { Overlay, overlayConfigFactory } from 'angular2-modal';
import { Modal, BSModalContext } from 'angular2-modal/plugins/bootstrap';

import { MappingConfigContext, MappingConfigComponent } from "./mapping-config.component";

import { QueryAuthorizeInfo, AuthorizeInfo, MappingService,BaseService } from '../../services';

import { MappingStatus } from 'crabyter-p0-server/Enum';
import * as server from 'crabyter-p0-server/ViewModel';

import _ from 'lodash';

@Component({
    // moduleId: module.id,
    selector: 'mapping-index',
    styleUrls: ['mapping-index.component.css'],
    templateUrl: 'mapping-index.component.html'
})
export class MappingIndexComponent implements OnInit, AfterViewInit {
    mappingList: Array<server.StandardStudyViewModel> = [];
    mappingListShowState = [];

    //当前选中的标准下标
    currentIndex = 0;

    //枚举
    enumMappingStatus = MappingStatus;

    //滚动
    @ViewChild('rightList') rightList;

    editorHeight = 0;

    constructor(private router: Router,
        private overlay: Overlay,
        private vcRef: ViewContainerRef,
        public modal: Modal,
        public mappingService: MappingService,
        public baseService: BaseService,
        @Inject(DOCUMENT) private document: any,
        private pageScrollService: PageScrollService) {
        overlay.defaultViewContainer = vcRef;
    }

    ngOnInit(): void {
        this.mappingService.getMappingList()
            .subscribe((data) => {
                this.mappingList = data;
                this.mappingList.forEach((value, index) => {
                    this.mappingListShowState.push(false);
                });
            });
    }

    ngAfterViewInit() {
        this.baseService.contentHeight.subscribe((data) => {
            this.editorHeight = data - 70;
        });
    }

    /**
     * 显示全部、收起显示
     * @param event
     * @param item
     */
    toggleShowStudy(event, itemIndex: number) {
        if (itemIndex > -1 && itemIndex < this.mappingListShowState.length) {
            this.mappingListShowState[itemIndex] = !this.mappingListShowState[itemIndex];
        }
        //console.log(this.mappingListShowState);
    }

    /**
     * 定位
     * @param event
     */
    locateRightContent(event, itemIndex: number) {
        this.currentIndex = itemIndex;
        //滚动
        let pageScrollInstance: PageScrollInstance = PageScrollInstance
            .simpleInlineInstance(this.document,
                `#standard${this.mappingList[this.currentIndex].StandardID}`,
                this.rightList.nativeElement);
        this.pageScrollService.start(pageScrollInstance);
    }

    /**
     * 标准课题映射设置
     */
    showAdminSetting() {
        this.modal.open(MappingConfigComponent, overlayConfigFactory(<MappingConfigContext>{
            mappingList: this.mappingList
        }, BSModalContext)).then((data) => {

        });
    }

    /**
     * mapping设置
     * @param mappingId
     */
    showMappingSetting(mappingId:number) {
        this.router.navigate([`/mapping/match/${mappingId}`]);
    }
}