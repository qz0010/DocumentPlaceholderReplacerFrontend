import {TuiBlockStatus} from '@taiga-ui/layout';
import {TuiAvatar, TuiFileLike, TuiFiles, TuiStepper, TuiStepperComponent} from '@taiga-ui/kit';
import {AsyncPipe, NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {catchError, delay, finalize, map, Observable, of, Subject, switchMap, tap} from 'rxjs';
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
    TuiIcon
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
  private readonly cdRef = inject(ChangeDetectorRef);
  public pending$ = signal(true);

  @ViewChild(TuiStepperComponent) private readonly stepper?: TuiStepperComponent;

  public step$ = signal(+(this.route.snapshot.queryParams['step'] || '0'));

  protected readonly control = new FormControl<TuiFileLike | null>(
    null,
  );

  protected readonly failedFiles$ = new Subject<TuiFileLike | null>();
  protected readonly loadingFiles$ = new Subject<TuiFileLike | null>();
  protected readonly loadedFiles$ = this.control.valueChanges.pipe(
    switchMap((file) => {
      console.log('switchMap', file);
      return this.processFile(file);
    }),
  );

  public columns$ = signal<string[]>(['var', 'value']);

  public data$ = signal<string[]>([]);

  public form: {[key: string]: string[]} = {};

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

    return this.http.post<{variables: string[]}>('http://localhost:3000/document/extract', formData).pipe(
      map((res) => {
        this.data$.set(res.variables);
        this.form = res.variables.reduce((acc, v) => {
          acc[v] = [];
          return acc;
        }, {} as {[key: string]: string[]});

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
}
