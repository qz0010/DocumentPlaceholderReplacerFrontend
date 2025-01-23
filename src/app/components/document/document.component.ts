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
import {AsyncPipe, NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase} from '@angular/common';
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
    NgSwitch,
    NgSwitchCase,
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
  public pending$ = signal(true);


  public copyTextLoading$ = new BehaviorSubject<boolean>(false); // Для управления показом loader
  public copyTextSuccess$ = new BehaviorSubject<boolean>(false); // Для управления показом success
  public copyTextError$ = new BehaviorSubject<boolean>(false); // На случай ошибки

  public copyText$ = new Subject<void>();

  @ViewChild(TuiStepperComponent) private readonly stepper?: TuiStepperComponent;

  public step$ = signal(+(this.route.snapshot.queryParams['step'] || '0'));

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

  public data$ = signal<string[]>([]);

  public form: { [key: string]: string[] } = {};

  ngAfterViewInit() {
    of(null)
      .pipe(
        delay(200),
        tap(() => {
          this.stepper?.activate(this.step$());
        }),
        delay(100),
        tap(() => {
          this.pending$.set(false);
        }),
      ).subscribe();


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
        this.data$.set(res.variables);
        this.form = res.variables.reduce((acc, v) => {
          acc[v] = [];
          return acc;
        }, {} as { [key: string]: string[] });

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

  public onCellChange(variable: string, value: Event): void {
    // this.form[variable] = value;
    console.log(variable, value, this.form)
  }

  public setStep(step: number): void {
    this.step$.set(step);
    this.router.navigate([], {queryParams: {step: this.step$()}})
  }

  public nextStep(): void {
    this.setStep(this.step$() + 1);
  }

  public prevStep(): void {
    this.setStep(this.step$() - 1);
  }

  public copyToClipboard() {
    try {
      navigator.clipboard.writeText('<~!Переменная!~>');
      console.log("Текст успешно скопирован в буфер!");
    } catch (err) {
      console.error("Ошибка при копировании текста: ", err);
    }
  }
}
