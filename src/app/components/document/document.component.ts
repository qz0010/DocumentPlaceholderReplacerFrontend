import {TuiBlockStatus} from '@taiga-ui/layout';
import {TuiFileLike, TuiFiles, TuiStepper, TuiStepperComponent} from '@taiga-ui/kit';
import {AsyncPipe, NgIf, NgSwitch, NgSwitchCase} from '@angular/common';
import {AfterViewInit, ChangeDetectionStrategy, Component, inject, signal, ViewChild} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import type {Observable} from 'rxjs';
import {finalize, map, of, Subject, switchMap} from 'rxjs';
import {TuiButton} from '@taiga-ui/core';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';

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

  @ViewChild(TuiStepperComponent) private readonly stepper?: TuiStepperComponent;

  public step$ = signal(+(this.route.snapshot.queryParams['step'] || '0'));

  protected readonly control = new FormControl<TuiFileLike | null>(
    null,
    Validators.required,
  );

  protected readonly failedFiles$ = new Subject<TuiFileLike | null>();
  protected readonly loadingFiles$ = new Subject<TuiFileLike | null>();
  protected readonly loadedFiles$ = this.control.valueChanges.pipe(
    switchMap((file) => this.processFile(file)),
  );

  ngAfterViewInit() {
    this.stepper?.activate(this.step$());
  }

  protected removeFile(): void {
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

    return this.http.post('http://localhost:3000/document/extract', formData).pipe(
      map(() => {
        return file;
      }),
      finalize(() => this.loadingFiles$.next(null)),
    );
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
