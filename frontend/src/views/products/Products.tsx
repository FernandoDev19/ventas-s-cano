import { useEffect, useState } from "react";
import type { Product } from "../../models";
import productService from "../../services/product.service";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Search, Plus } from "lucide-react";
import { screenWidth } from "../../utils/screen-width.util";

const MySwal = withReactContent(Swal);

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProducts();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const products = await productService.getProducts();
      setProducts(products);
    } catch (error) {
      console.error(error);
      MySwal.fire({
        title: "Error",
        text: "Error al cargar los productos",
        icon: "error",
      });
      setError("Error al cargar los productos");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClickProduct = (product: Product) => {
    MySwal.fire({
      title: product.name,
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Precio</label>
            <p class="text-lg font-semibold text-green-600">$${product.price.toLocaleString()} COP</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Stock disponible</label>
            <p class="text-lg font-semibold ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}">
              ${product.stock} unidades
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              product.stock > 10 
                ? 'bg-green-100 text-green-800' 
                : product.stock > 0 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
            }">
              ${product.stock > 10 ? 'Disponible' : product.stock > 0 ? 'Stock bajo' : 'Agotado'}
            </span>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Valor total en inventario</label>
            <p class="text-lg font-semibold text-blue-600">$${(product.price * product.stock).toLocaleString()} COP (${product.stock} x $${product.price.toLocaleString()})</p>
          </div>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Editar producto',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      preConfirm: () => {
        return MySwal.fire({
          title: 'Editar producto',
          html: `
            <div class="text-left space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
                <input id="swal-input1" class="swal2-input" style="margin: 0px; width: 100%;" value="${product.name}" placeholder="Nombre del producto">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <input id="swal-input2" type="number" style="margin: 0px; width: 100%;" class="swal2-input" value="${product.price}" placeholder="Precio">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input id="swal-input3" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Stock" value="${product.stock}" />
              </div>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: 'Guardar cambios',
          cancelButtonText: 'Cancelar',
          preConfirm: () => {
            const name = (document.getElementById('swal-input1') as HTMLInputElement).value;
            const price = (document.getElementById('swal-input2') as HTMLInputElement).value;
            const stock = (document.getElementById('swal-input3') as HTMLInputElement).value;
            
            if (!name || !price || !stock) {
              MySwal.showValidationMessage('Por favor completa todos los campos');
              return false;
            }
            
            return { name, price: Number(price), stock: Number(stock) };
          }
        }).then((result) => {
          if (result.isConfirmed) {
            // Aquí iría la lógica para actualizar el producto
            productService.updateProduct(product._id!, result.value)
              .then(() => {
                MySwal.fire({
                  title: '¡Actualizado!',
                  text: 'El producto ha sido actualizado correctamente',
                  icon: 'success',
                  timer: 2000,
                  showConfirmButton: false
                });
                loadProducts(); // Recargar la lista
              })
              .catch((error) => {
                MySwal.fire({
                  title: 'Error',
                  text: 'No se pudo actualizar el producto',
                  icon: 'error'
                });
                console.error('Error updating product:', error);
              });
          }
        });
      }
    });
  };

  const handleCreateProduct = () => {
    MySwal.fire({
      title: 'Crear nuevo producto',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
            <input id="swal-input1" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Nombre del producto">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Precio</label>
            <input id="swal-input2" type="number" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Precio">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input id="swal-input3" type="number" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Stock" />
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear producto',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const name = (document.getElementById('swal-input1') as HTMLInputElement).value;
        const price = (document.getElementById('swal-input2') as HTMLInputElement).value;
        const stock = (document.getElementById('swal-input3') as HTMLInputElement).value;
        
        if (!name || !price || !stock) {
          MySwal.showValidationMessage('Por favor completa todos los campos');
          return false;
        }
        
        return { name, price: Number(price), stock: Number(stock) };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        productService.createProduct(result.value)
          .then(() => {
            MySwal.fire({
              title: '¡Creado!',
              text: 'El producto ha sido creado correctamente',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            loadProducts(); // Recargar la lista
          })
          .catch((error) => {
            MySwal.fire({
              title: 'Error',
              text: 'No se pudo crear el producto',
              icon: 'error'
            });
            console.error('Error creating product:', error);
          });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 text-lg font-semibold mb-4">{error}</div>
        <button
          onClick={loadProducts}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Productos</h1>
        <button
          onClick={handleCreateProduct}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className='w-5 h-6 md:w-4 md:h-4' />
          { screenWidth.isMobile ? '' : 'Crear producto' }
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500 text-lg">No hay productos registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              onClick={() => handleClickProduct(product)}
              className="p-4 border rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:bg-primary/10 transform hover:scale-105 cursor-pointer"
            >
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
