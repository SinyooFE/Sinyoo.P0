import { Component, OnInit, ViewContainerRef, ViewChild, AfterViewInit } from '@angular/core';

import { Router } from '@angular/router';

import { Overlay, overlayConfigFactory } from 'angular2-modal';
import { Modal, BSModalContext } from 'angular2-modal/plugins/bootstrap';

import { ConceptEditorComponent } from './concept-editor.component';

import { QueryAuthorizeInfo, AuthorizeInfo } from '../../services/authenication'

@Component({
    // moduleId: module.id,
    selector: 'concept-index',
    styleUrls: ['concept-index.component.css'],
    templateUrl: 'concept-index.component.html'
})
export class ConceptIndexComponent implements OnInit, AfterViewInit {

    constructor(private router: Router,
        private overlay: Overlay,
        private vcRef: ViewContainerRef,
        public modal: Modal) {
        overlay.defaultViewContainer = vcRef;
    }

    ngOnInit(): void {

    }

    ngAfterViewInit() {

    }
}