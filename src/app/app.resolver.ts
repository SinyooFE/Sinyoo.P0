import { Title } from '@angular/platform-browser';
import * as Service from './services';

// an array of services to resolve routes with data
export const APP_RESOLVER_PROVIDERS = [
  Title,

  Service.BaseService,

  Service.AuthenicationService,
  Service.QueryAuthorizeInfo,
  Service.UserService,
  Service.CanActivateLoginService,
  Service.CanActivateChildLoginService,

  Service.MappingService,

  Service.MyTaskService,

  Service.StandardService,

  Service.ConceptOutService,
  Service.TerminologyService,

  Service.ErrorLogService,
  // CAUTION: This providers collection overrides the CORE ErrorHandler with our
  // custom version of the service that logs errors to the ErrorLogService.
  Service.LOGGING_ERROR_HANDLER_PROVIDERS,
  // OPTIONAL: By default, our custom LoggingErrorHandler has behavior around
  // rethrowing and / or unwrapping errors. In order to facilitate dependency-
  // injection instead of resorting to the use of a Factory for instantiation,
  // these options can be overridden in the providers collection.
  {
    provide: Service.LOGGING_ERROR_HANDLER_OPTIONS,
    useValue: {
      rethrowError: false,
      unwrapError: false,
      sendToService: false    //是否发送错误到exceptionless
    }
  }
];
