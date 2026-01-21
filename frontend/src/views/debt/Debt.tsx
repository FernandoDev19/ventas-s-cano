import { useEffect, useState } from "react";
import type { ProductQuantity, Sale } from "../../models/sale.model";
import type { Customer } from "../../models/customer.model";
import type { Product } from "../../models/product.model";
import saleService from "../../services/sale.service";
import customerService from "../../services/customer.service";
import productService from "../../services/product.service";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function Debt() {
  const [totalDebt, setTotalDebt] = useState(0);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingSaleId, setPayingSaleId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Cargar solo deudas y datos relacionados
        const [salesData, customersData, productsData] = await Promise.all([
          saleService.getDebtSales(), // Solo ventas fiadas
          customerService.getCustomers(),
          productService.getProducts()
        ]);

        setSales(salesData);
        setCustomers(customersData);
        setProducts(productsData);

        // Calcular total de deudas
        const total = salesData.reduce((sum, sale) => sum + sale.total, 0);
        setTotalDebt(total);
      } catch (error) {
        console.error('Error loading debt data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  // Funciones helper
  const getCustomerName = (customerId: string): string => {
    const customer = customers.find(c => c._id === customerId);
    return customer?.name || 'Cliente desconocido';
  };

  const getProductName = (productId: string): string => {
    const product = products.find(p => p._id === productId);
    return product?.name || 'Producto desconocido';
  };

  const getSaleProductsSummary = (saleProducts: ProductQuantity[]): string => {
    return saleProducts.map(item => {
      const productName = getProductName(item.product.toString());
      return `${productName} x${item.quantity}`;
    }).join(', ');
  };

  // Marcar como pagada
  const handleMarkAsPaid = async (saleId: string) => {
    setPayingSaleId(saleId);
    try {
      await saleService.markSaleAsPaid(saleId);

      // Actualizar estado local
      setSales(prevSales => prevSales.filter(sale => sale._id !== saleId));
      setTotalDebt(prev => prev - (sales.find(s => s._id === saleId)?.total || 0));

      await MySwal.fire({
        title: '¡Deuda Pagada!',
        text: 'La deuda ha sido marcada como pagada exitosamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al marcar como pagada:', error);
      await MySwal.fire({
        title: 'Error',
        text: 'No se pudo marcar la deuda como pagada',
        icon: 'error',
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setPayingSaleId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-red-600">Deudas Pendientes</h1>
      
      <div className="p-6 rounded-lg shadow-md bg-red-600 text-white">
        <p className="text-md">Total Deudas Pendientes</p>
        <h2 className="text-2xl font-bold">
          ${totalDebt.toLocaleString()} COP
        </h2>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Deudas por cobrar:</h2>
        <div className="space-y-2">
          {sales.length === 0 ? (
            <p className="text-gray-500">No hay deudas pendientes</p>
          ) : (
            <ul className="space-y-2">
              {sales.map((sale) => (
                <li key={sale._id} className="p-5 rounded-lg shadow-md">
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <h2 className="font-bold text-lg">
                        {getCustomerName(sale.customer as string)}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {sale.createdAt
                          ? new Date(sale.createdAt).toLocaleString()
                          : "Fecha no disponible"}
                      </p>
                    </div>
                    <span className="text-white font-bold text-xs rounded-full px-2 py-1 bg-yellow-500">
                      Fiado
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Productos:</strong> {getSaleProductsSummary(sale.products)}
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-500">
                        {sale.products.length} producto{sale.products.length !== 1 ? 's' : ''}
                      </span>
                      <span className="font-semibold text-lg">
                        Total: ${(Number(sale.total)).toLocaleString()} COP
                      </span>
                    </div>
                  </div>

                  {sale.debtDate && (
                    <div className="mt-2 text-sm text-orange-600">
                      <strong>Fecha de deuda:</strong> {new Date(sale.debtDate).toLocaleDateString()}
                    </div>
                  )}

                  <button
                    onClick={() => handleMarkAsPaid(sale._id!)}
                    disabled={payingSaleId === sale._id}
                    className="w-full mt-3 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {payingSaleId === sale._id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Marcar como pagada
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
