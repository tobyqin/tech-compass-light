import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
  selector: 'app-justification-edit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextareaModule],
  template: `
    <p-dialog 
      [(visible)]="visible" 
      [modal]="true"
      [closable]="false"
      [style]="{ width: '500px' }"
      [baseZIndex]="1100"
      [contentStyle]="{ 'text-align': 'center', 'min-height': '120px' }"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      [showHeader]="true"
      header="Edit Justification"
    >
      <div style="margin-bottom: 0.5rem; width: 100%;">
        <textarea id="justification" pInputTextarea [(ngModel)]="justification" [rows]="4" style="width: 100%; margin-top: 0.5rem; min-height: 80px; resize: vertical;" placeholder="Enter justification..."></textarea>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" class="p-button-text" (click)="cancel()"></button>
        <button pButton label="Confirm" [disabled]="!justification.trim()" (click)="confirm()"></button>
      </ng-template>
    </p-dialog>
  `
})
export class JustificationEditDialogComponent {
  @Input() visible = false;
  @Input() justification = '';
  @Output() confirmEvent = new EventEmitter<string>();
  @Output() cancelEvent = new EventEmitter<void>();

  confirm() {
    this.confirmEvent.emit(this.justification.trim());
  }

  cancel() {
    this.cancelEvent.emit();
  }
} 