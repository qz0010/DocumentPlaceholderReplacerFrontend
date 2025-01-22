import {TuiBlockStatus} from '@taiga-ui/layout';
import type {TuiFileLike} from '@taiga-ui/kit';
import {TuiFiles, TuiStepper} from '@taiga-ui/kit';
import {AsyncPipe, NgIf, NgSwitch, NgSwitchCase} from '@angular/common';
import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import type {Observable} from 'rxjs';
import {finalize, map, of, Subject, switchMap, timer} from 'rxjs';
import {TuiButton} from '@taiga-ui/core';

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
export class DocumentComponent {
  public step$ = signal(0);

  protected readonly control = new FormControl<TuiFileLike | null>(
    null,
    Validators.required,
  );

  protected readonly failedFiles$ = new Subject<TuiFileLike | null>();
  protected readonly loadingFiles$ = new Subject<TuiFileLike | null>();
  protected readonly loadedFiles$ = this.control.valueChanges.pipe(
    switchMap((file) => this.processFile(file)),
  );

  protected removeFile(): void {
    this.control.setValue(null);
  }

  protected processFile(file: TuiFileLike | null): Observable<TuiFileLike | null> {
    this.failedFiles$.next(null);

    if (this.control.invalid || !file) {
      return of(null);
    }

    this.loadingFiles$.next(file);

    return timer(1000).pipe(
      map(() => {
        if (Math.random() > 0.5) {
          return file;
        }

        this.failedFiles$.next(file);

        return null;
      }),
      finalize(() => this.loadingFiles$.next(null)),
    );
  }

  public setStep(step: number): void {
    this.step$.set(step);
  }

  public nextStep(): void {
    this.step$.set(this.step$() + 1);
  }

  public prevStep(): void {
    this.step$.set(this.step$() - 1);
  }
}
