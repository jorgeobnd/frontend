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

  // Estado para creación de producto
  isCreatingProduct = false;
  newProduct = { name: '', sku: '', price: 0 };
  isSubmitting = false;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.apiService.getBranches().subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.branches = data;
        } else if (data && typeof data === 'object') {
          this.branches = [data];
        } else {
          this.branches = [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar sucursales:', err)
    });
  }

  selectBranch(branchId: number): void {
    this.selectedBranchId = branchId;
    this.isCreatingProduct = false; // Resetear formulario al cambiar sucursal
    this.loadInventory();
  }

  loadInventory(): void {
    if (this.selectedBranchId) {
      this.apiService.getInventoryByBranch(this.selectedBranchId).subscribe({
        next: (data) => {
          this.inventory = data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al cargar inventario:', err)
      });
    }
  }

  updateStock(item: InventoryItem): void {
    if (this.selectedBranchId) {
      if (item.stock < 0) item.stock = 0;

      this.apiService.updateStock(this.selectedBranchId, item.productId, item.stock)
        .subscribe({
          next: () => console.log(`Stock actualizado: ${item.stock}`),
          error: (err) => console.error('Error actualización:', err)
        });
    }
  }

  // --- Nueva Lógica de Creación ---

  toggleCreateForm(): void {
    this.isCreatingProduct = !this.isCreatingProduct;
    if (!this.isCreatingProduct) {
      this.resetForm();
    }
  }

  createProduct(): void {
    if (!this.newProduct.name || !this.newProduct.sku) return;

    this.isSubmitting = true;
    this.apiService.createProduct(this.newProduct).subscribe({
      next: (createdProduct) => {
        console.log('Producto creado:', createdProduct);

        // Agregar a la tabla localmente (Optimistic UI)
        // Como es nuevo, el stock en esta sucursal es 0
        const newItem: InventoryItem = {
          productId: createdProduct.id,
          productName: createdProduct.name,
          productSku: createdProduct.sku,
          stock: 0
        };

        this.inventory.push(newItem);
        this.resetForm();
        this.isCreatingProduct = false;
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al crear producto:', err);
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    this.newProduct = { name: '', sku: '', price: 0 };
  }
}
