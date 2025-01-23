import {TuiBlockStatus} from '@taiga-ui/layout';
import {
  TuiAvatar,
  TuiButtonLoading,
  TuiChip,
  TuiFileLike,
  TuiFiles,
  TuiStepper,
  TuiStepperComponent
} from '@taiga-ui/kit';
import {AsyncPipe, NgClass, NgFor, NgIf} from '@angular/common';
import {AfterViewInit, ChangeDetectionStrategy, Component, inject, signal, ViewChild} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BehaviorSubject, catchError, delay, finalize, from, map, Observable, of, Subject, switchMap, tap} from 'rxjs';
import {TuiButton, TuiIcon, TuiLoader, TuiScrollbar} from '@taiga-ui/core';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {TuiTable} from '@taiga-ui/addon-table';
import {TuiTextareaModule} from '@taiga-ui/legacy';
import {WaIntersectionObserver} from '@ng-web-apis/intersection-observer';

@Component({
  selector: 'app-document',
  imports: [
    ReactiveFormsModule,
    NgIf,
    TuiBlockStatus,
    TuiStepper,
    TuiFiles,
    AsyncPipe,
    TuiButton,
    TuiAvatar,
    TuiLoader,
    NgClass,
    NgFor,
    TuiTable,
    TuiTextareaModule,
    FormsModule,
    TuiScrollbar,
    WaIntersectionObserver,
    TuiIcon,
    TuiButtonLoading,
    TuiChip
  ],
  templateUrl: './document.component.html',
  styleUrl: './document.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentComponent implements AfterViewInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  public pending$ = signal(false);


  public copyTextLoading$ = new BehaviorSubject<boolean>(false); // Для управления показом loader
  public copyTextSuccess$ = new BehaviorSubject<boolean>(false); // Для управления показом success
  public copyTextError$ = new BehaviorSubject<boolean>(false); // На случай ошибки

  public copyText$ = new Subject<void>();

  @ViewChild(TuiStepperComponent) private readonly stepper?: TuiStepperComponent;

  protected readonly control = new FormControl<TuiFileLike | null>(
    null,
  );

  protected readonly failedFiles$ = new Subject<TuiFileLike | null>();
  protected readonly loadingFiles$ = new Subject<TuiFileLike | null>();
  protected readonly loadedFiles$ = this.control.valueChanges.pipe(
    switchMap((file) => {
      return this.processFile(file);
    }),
  );

  public columns$ = signal<string[]>(['var', 'value']);

  public data$ = signal<any[]>([]);

  public form: { [key: string]: string[] } = {};

  ngAfterViewInit() {
    this.copyText$.pipe(
      tap(() => {
        this.copyTextLoading$.next(true);        // Показать loader
        this.copyTextSuccess$.next(false);      // Скрыть success
        this.copyTextError$.next(false);        // Сбросить ошибку
      }),
      switchMap(() =>
        from(navigator.clipboard.writeText('<~!Переменная!~>')).pipe( // Скопировать текст
          delay(400), // Подождать 1 секунду
          tap(() => {
            this.copyTextLoading$.next(false);   // Скрыть loader
            this.copyTextSuccess$.next(true);   // Показать success
          }),
          delay(600), // Подождать ещё 1 секунду
          tap(() => {
            this.copyTextSuccess$.next(false);  // Скрыть success
          }),
          catchError(error => {
            this.copyTextLoading$.next(false);   // Скрыть loader
            this.copyTextError$.next(true);     // Показать сообщение об ошибке
            return of(null);       // Вернуть поток с пустым значением
          })
        )
      )
    ).subscribe()
  }

  protected removeFile(): void {
    this.failedFiles$.next(null);
    this.control.setValue(null);
  }

  protected processFile(file: TuiFileLike | null): Observable<TuiFileLike | null> {
    this.failedFiles$.next(null);

    if (this.control.invalid || !file) {
      return of(null);
    }

    const formData = new FormData();
    formData.append('file', file as File);

    this.loadingFiles$.next(file);

    return this.http.post<{ variables: string[] }>('http://localhost:3000/document/extract', formData).pipe(
      map((res) => {
        const b: any = {};
        this.data$.set(
          res.variables.reduce((acc, _var) => {
            if (_var in b) {
              b[_var]++;
            }
            acc.push({
              variable: _var,
              index: b[_var] || 0
            });
            b[_var] = 0;

            this.form[_var] = [];

            return acc;
          }, [] as any[])
        );
        console.log('dadadad', this.data$());

        return file;
      }),
      catchError(err => {
        this.loadingFiles$.next(null);
        this.failedFiles$.next(file);

        return of(null);
      }),
      finalize(() => this.loadingFiles$.next(null)),
    );
  }

  public onSubmit(): void {
    this.pending$.set(true);
    const formData = new FormData();
    formData.append('file', this.control.value as File);
    Object.keys(this.form).forEach((key: string, index) => {
      this.form[key].forEach((value: string, _index) => {
        formData.append(`${key}[${_index}]`, value);
      })
    });
    this.http.post('http://localhost:3000/document/replace', formData, {
      responseType: 'blob'
    }).pipe(
      finalize(() => this.pending$.set(false))
    )
      .subscribe(res => {
        const file = new Blob([res], { type: 'application/binary' });
        const fileURL = URL.createObjectURL(file);

        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.href = fileURL;
        downloadAnchorNode.download = `${this.control.value?.name}`;

        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
  }
}
