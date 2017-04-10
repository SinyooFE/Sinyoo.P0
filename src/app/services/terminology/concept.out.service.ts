import { Injectable } from '@angular/core';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { Observable } from 'rxjs/Observable';

import { ConceptEditorComponent } from '../../components/terminology';

@Injectable()
export class ConceptOutService implements CanDeactivate<ConceptEditorComponent> {
    canDeactivate(
        component: ConceptEditorComponent,
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        console.log('CanDeactivate');
        return component.checkLeave();
    }
}