import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';

type TagSeverity = 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-status-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextareaModule,
    TagModule
  ],
  template: `
    <p-dialog 
      [(visible)]="visible" 
      [header]="'Change ' + fieldName" 
      [modal]="true"
      [style]="{ width: '600px' }"
      [draggable]="false"
      [resizable]="false"
      [closable]="false">
      <div class="status-change-dialog">
        <div class="status-change-info">
          <div class="status-flow">
            <p-tag [value]="oldValue" [severity]="getSeverity(oldValue)"></p-tag>
            <i class="pi pi-arrow-right"></i>
            <p-tag [value]="newValue" [severity]="getSeverity(newValue)"></p-tag>
          </div>
        </div>
        <div class="field mt-3">
          <label for="status_change_justification" class="font-medium">Status Change Justification Required</label>
          <small class="block text-gray-600 mb-2">Please explain why you are making this status change:</small>
          <textarea 
            id="status_change_justification"
            pInputTextarea 
            [(ngModel)]="status_change_justification"
            [rows]="4"
            [autoResize]="true"
            class="w-full"
            placeholder="Enter a clear and specific reason for this status change...">
          </textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button 
          pButton 
          label="Cancel" 
          class="p-button-text" 
          (click)="onCancel()">
        </button>
        <button 
          pButton 
          label="Confirm" 
          [disabled]="!status_change_justification?.trim()"
          (click)="onConfirm()">
        </button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .status-change-dialog {
      .status-change-info {
        background: var(--surface-50);
        border-radius: 6px;
        padding: 1rem;
        
        .status-flow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          
          .pi-arrow-right {
            color: var(--text-color-secondary);
          }
        }
      }

      .field {
        margin-bottom: 1rem;
        
        label {
          display: block;
          margin-bottom: 0.5rem;
        }

        textarea {
          min-height: 100px;
        }
      }
    }
  `]
})
export class StatusChangeDialogComponent {
  visible = false;
  status_change_justification = '';
  fieldName = '';
  oldValue = '';
  newValue = '';
  
  private resolveRef!: (value: string) => void;
  private rejectRef!: () => void;

  show(fieldName: string, oldValue: string, newValue: string): Promise<string> {
    this.visible = true;
    this.fieldName = fieldName;
    this.oldValue = oldValue || 'None';
    this.newValue = newValue;
    this.status_change_justification = '';
    
    return new Promise<string>((resolve, reject) => {
      this.resolveRef = resolve;
      this.rejectRef = reject;
    });
  }

  onConfirm() {
    this.visible = false;
    this.resolveRef(this.status_change_justification.trim());
  }

  onCancel() {
    this.visible = false;
    this.rejectRef();
  }

  getSeverity(status: string): TagSeverity {
    if (this.fieldName === 'Recommend Status') {
      switch (status) {
        case 'ADOPT': return 'success';
        case 'TRIAL': return 'info';
        case 'ASSESS': return 'warning';
        case 'HOLD': return 'danger';
        case 'EXIT': return 'danger';
        default: return 'secondary';
      }
    } else { // Review Status
      switch (status) {
        case 'APPROVED': return 'success';
        case 'PENDING': return 'warning';
        case 'REJECTED': return 'danger';
        default: return 'secondary';
      }
    }
  }
} 