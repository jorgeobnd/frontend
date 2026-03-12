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

  // Estado para gestión de sucursales
  isManagingBranch = false;
  isEditingBranch = false;
  branchForm: Branch = { id: 0, name: '', address: '' };
  isBranchSubmitting = false;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
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

  // --- Lógica de Gestión de Sucursales ---

  openNewBranchForm(): void {
    this.isManagingBranch = true;
    this.isEditingBranch = false;
    this.branchForm = { id: 0, name: '', address: '' };
  }

  openEditBranchForm(branch: Branch, event: Event): void {
    event.stopPropagation(); // Evitar seleccionar la sucursal al hacer clic en editar
    this.isManagingBranch = true;
    this.isEditingBranch = true;
    this.branchForm = { ...branch };
  }

  closeBranchForm(): void {
    this.isManagingBranch = false;
    this.isEditingBranch = false;
    this.branchForm = { id: 0, name: '', address: '' };
  }

  saveBranch(): void {
    if (!this.branchForm.name || !this.branchForm.address) return;

    this.isBranchSubmitting = true;

    if (this.isEditingBranch) {
      this.apiService.updateBranch(this.branchForm.id, this.branchForm).subscribe({
        next: (updatedBranch) => {
          // Actualizar lista localmente
          const index = this.branches.findIndex(b => b.id === updatedBranch.id);
          if (index !== -1) {
            this.branches[index] = updatedBranch;
          }
          this.closeBranchForm();
          this.isBranchSubmitting = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al actualizar sucursal:', err);
          this.isBranchSubmitting = false;
        }
      });
    } else {
      this.apiService.createBranch(this.branchForm).subscribe({
        next: (newBranch) => {
          this.branches.push(newBranch);
          this.closeBranchForm();
          this.isBranchSubmitting = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al crear sucursal:', err);
          this.isBranchSubmitting = false;
        }
      });
    }
  }

  deleteBranch(branchId: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar esta sucursal? Esta acción no se puede deshacer.')) return;

    this.apiService.deleteBranch(branchId).subscribe({
      next: () => {
        this.branches = this.branches.filter(b => b.id !== branchId);
        if (this.selectedBranchId === branchId) {
          this.selectedBranchId = null;
          this.inventory = [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al eliminar sucursal:', err)
    });
  }

  // --- Nueva Lógica de Creación de Producto ---

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
