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

  // Estado para edición de producto
  isEditingProduct = false;
  editingProduct: any = { id: 0, name: '', sku: '', price: 0 };
  isProductSubmitting = false;

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
    this.isCreatingProduct = false;
    this.isEditingProduct = false; // Resetear edición
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
    event.stopPropagation();
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
    if (!confirm('¿Estás seguro de eliminar esta sucursal?')) return;

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

  // --- Nueva Lógica de Creación/Edición de Producto ---

  toggleCreateForm(): void {
    this.isCreatingProduct = !this.isCreatingProduct;
    this.isEditingProduct = false; // Cerrar edición si se abre creación
    if (!this.isCreatingProduct) {
      this.resetForm();
    }
  }

  createProduct(): void {
    if (!this.newProduct.name || !this.newProduct.sku) return;

    this.isSubmitting = true;
    this.apiService.createProduct(this.newProduct).subscribe({
      next: (createdProduct) => {
        const newItem: InventoryItem = {
          productId: createdProduct.id,
          productName: createdProduct.name,
          productSku: createdProduct.sku,
          price: createdProduct.price,
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

  // Métodos para Edición de Producto

  openEditProductForm(item: InventoryItem): void {
    this.isEditingProduct = true;
    this.isCreatingProduct = false; // Cerrar creación si se abre edición
    // Copiamos los datos del item seleccionado
    this.editingProduct = {
      id: item.productId,
      name: item.productName,
      sku: item.productSku,
      price: item.price
    };
  }

  cancelEditProduct(): void {
    this.isEditingProduct = false;
    this.editingProduct = { id: 0, name: '', sku: '', price: 0 };
  }

  saveEditedProduct(): void {
    if (!this.editingProduct.name || !this.editingProduct.sku) return;

    this.isProductSubmitting = true;

    // Llamada al backend para actualizar el producto globalmente
    this.apiService.updateProduct(this.editingProduct.id, this.editingProduct).subscribe({
      next: (updatedProduct) => {
        // Actualizar la lista localmente
        const index = this.inventory.findIndex(item => item.productId === updatedProduct.id);
        if (index !== -1) {
          this.inventory[index].productName = updatedProduct.name;
          this.inventory[index].productSku = updatedProduct.sku;
          this.inventory[index].price = updatedProduct.price;
        }

        this.isProductSubmitting = false;
        this.isEditingProduct = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al actualizar producto:', err);
        this.isProductSubmitting = false;
      }
    });
  }

  deleteProduct(item: InventoryItem): void {
    if (!confirm(`¿Eliminar producto "${item.productName}" del catálogo global? Esto borrará su historial en TODAS las sucursales.`)) return;

    this.apiService.deleteProduct(item.productId).subscribe({
      next: () => {
        // Remover de la lista local
        this.inventory = this.inventory.filter(i => i.productId !== item.productId);
        this.cdr.detectChanges();
        // Si estaba editando este producto, cerrar el formulario
        if (this.isEditingProduct && this.editingProduct.id === item.productId) {
            this.cancelEditProduct();
        }
      },
      error: (err) => console.error('Error al eliminar producto:', err)
    });
  }

  resetForm(): void {
    this.newProduct = { name: '', sku: '', price: 0 };
  }
}
