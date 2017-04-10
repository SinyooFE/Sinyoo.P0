import { Routes } from '@angular/router';

import { AuthenicationComponent } from './components/authenication';
import { ConceptIndexComponent, ConceptEditorComponent, ConceptTypeIndexComponent } from './components/terminology';
import { StandardIndexComponent, StandardUpdateComponent, DomainUpdateComponent, VariableEditorComponent } from './components/standard';
import { MappingIndexComponent, MappingMatchIndexComponent, MappingMatchOptionComponent } from './components/mapping';
import { MyTaskComponent } from './components/mytask';

import { CanActivateLoginService, CanActivateChildLoginService, ConceptOutService } from './services';

/**For Root */
export const ROOTROUTES: Routes = [
    {
        path: '',
        redirectTo: '/terminology/concept',
        pathMatch: 'full'
    }, {
        path: 'terminology',
        component: ConceptIndexComponent,
        canActivateChild: [CanActivateChildLoginService],
        children: [
            {
                path: '',
                redirectTo: '/terminology/concept',
                pathMatch: 'full'
            },
            {
                path: 'concept',
                component: ConceptEditorComponent,
                canDeactivate: [ConceptOutService]
            },
            {
                path: 'concept/:conceptid/:conceptoperate',
                component: ConceptEditorComponent,
                canDeactivate: [ConceptOutService]
            },
            {
                path: 'concepttype',
                component: ConceptTypeIndexComponent
            }
        ]
    }, {
        path: 'mapping',
        canActivateChild: [CanActivateChildLoginService],
        children: [
            {
                path: '',
                component: MappingIndexComponent
            },
            {
                path: 'match/:mappingid',
                component: MappingMatchIndexComponent
            },
            {
                path: 'option/:mappingid',
                component: MappingMatchOptionComponent
            }
        ]
    }, {
        path: 'standard',
        canActivateChild: [CanActivateChildLoginService],
        children: [
            {
                path: '',
                component: StandardIndexComponent,
                // outlet: "main"
            },
            {
                path: 'standardedit/:standardid',
                component: StandardUpdateComponent
            },
            {
                path: 'domainedit/:standardid/:domainid',
                component: DomainUpdateComponent
            },
            {
                path: 'variableedit/:standardid/:domainid/:variableid',
                component: VariableEditorComponent
            }
        ]
    }, {
        path: 'authorize',
        component: AuthenicationComponent
    }, {
        path: 'mytask',
        component: MyTaskComponent,
        canActivate: [CanActivateLoginService]
    }
];

/**For Child */
export const CHILDROUTES: Routes = [];




