import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Branch } from '../../models/branch.model';
import { InventoryItem } from '../../models/inventory.model';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-inventory',
  standalone: false,
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  branches: Branch[] = [];
  selectedBranchId: number | null = null;
  inventory: InventoryItem[] = [];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef // Inyectamos el detector de cambios
  ) {}

  ngOnInit(): void {
    this.apiService.getBranches().subscribe({
      next: (data: any) => {
        console.log('Datos recibidos del backend:', data);

        // Validación robusta: Asegurar que sea un array
        if (Array.isArray(data)) {
          this.branches = data;
        } else if (data && typeof data === 'object') {
          // Si devuelve un solo objeto, lo convertimos en array
          this.branches = [data];
        } else {
          this.branches = [];
        }

        console.log('Branches procesadas:', this.branches);

        // Forzar actualización de la vista
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar sucursales:', err);
      }
    });
  }

  selectBranch(branchId: number): void {
    this.selectedBranchId = branchId;
    this.loadInventory();
  }

  loadInventory(): void {
    if (this.selectedBranchId) {
      this.apiService.getInventoryByBranch(this.selectedBranchId).subscribe({
        next: (data) => {
          this.inventory = data;
          this.cdr.detectChanges(); // Forzar actualización también aquí
        },
        error: (err) => {
          console.error('Error al cargar inventario:', err);
        }
      });
    }
  }

  updateStock(item: InventoryItem): void {
    if (this.selectedBranchId) {
      if (item.stock < 0) item.stock = 0;

      this.apiService.updateStock(this.selectedBranchId, item.productId, item.stock)
        .subscribe({
          next: () => {
            console.log(`Stock actualizado: ${item.stock}`);
          },
          error: (err) => console.error('Error actualización:', err)
        });
    }
  }
}
