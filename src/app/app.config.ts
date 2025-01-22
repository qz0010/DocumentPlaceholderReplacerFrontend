import {NG_EVENT_PLUGINS} from "@taiga-ui/event-plugins";
import {provideAnimations} from "@angular/platform-browser/animations";
import {ApplicationConfig, LOCALE_ID, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideClientHydration, withEventReplay} from '@angular/platform-browser';
import {provideHttpClient} from '@angular/common/http';
import {TUI_LANGUAGE, TUI_RUSSIAN_LANGUAGE} from '@taiga-ui/i18n';
import {of} from 'rxjs';
import {TUI_DIGITAL_INFORMATION_UNITS} from '@taiga-ui/kit';
import {DATE_PIPE_DEFAULT_OPTIONS, DatePipeConfig} from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    NG_EVENT_PLUGINS,
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'ru-RU' },
    {
      provide: TUI_LANGUAGE,
      useValue: of(TUI_RUSSIAN_LANGUAGE),
    },
    {
      provide: TUI_DIGITAL_INFORMATION_UNITS,
      useValue: of(['B', 'Kb', 'Mb', 'Gb']),
    },
    {
      provide: DATE_PIPE_DEFAULT_OPTIONS,
      useValue: {
        dateFormat: 'dd.MM.YYYY HH:mm:ss',
      } as DatePipeConfig,
    },
  ]
};
