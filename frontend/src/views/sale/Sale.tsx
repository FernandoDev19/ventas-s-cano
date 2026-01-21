import { useEffect, useState } from "react";
import type { ProductQuantity, Sale } from "../../models/sale.model";
import type { Customer } from "../../models/customer.model";
import type { Product } from "../../models/product.model";
import saleService from "../../services/sale.service";
import customerService from "../../services/customer.service";
import productService from "../../services/product.service";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Link } from "react-router";

export default function Sale() {
  const [totalDay, setTotalDay] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingSaleId, setPayingSaleId] = useState<string | null>(null);

  const MySwal = withReactContent(Swal);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Cargar todos los datos en paralelo
        const [salesData, customersData, productsData] = await Promise.all([
          saleService.getTodaySales(), // Solo ventas de hoy
          customerService.getCustomers(),
          productService.getProducts()
        ]);

        setSales(salesData);
        setCustomers(customersData);
        setProducts(productsData);

        // Calcular totales
        const total = salesData.reduce((sum, sale) => sum + sale.total, 0);
        const totalReceived = salesData
          .filter((sale) => !sale.isDebt)
          .reduce((sum, sale) => sum + sale.total, 0);
        const totalPending = salesData
          .filter((sale) => sale.isDebt)
          .reduce((sum, sale) => sum + sale.total, 0);

        setTotalDay(total);
        setTotalReceived(totalReceived);
        setTotalPending(totalPending);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  // Funciones helper para obtener nombres
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

  // Función para marcar venta como pagada
  const handleMarkAsPaid = async (saleId: string) => {
    setPayingSaleId(saleId);
    try {
      await saleService.markSaleAsPaid(saleId);

      // Actualizar la venta en el estado local
      setSales(prevSales => 
        prevSales.map(sale => 
          sale._id === saleId 
            ? { ...sale, isDebt: false }
            : sale
        )
      );

      // Recalcular totales
      const updatedSales = sales.map(sale => 
        sale._id === saleId 
          ? { ...sale, isDebt: false }
          : sale
      );
      
      const newTotalReceived = updatedSales
        .filter((sale) => !sale.isDebt)
        .reduce((sum, sale) => sum + sale.total, 0);
      const newTotalPending = updatedSales
        .filter((sale) => sale.isDebt)
        .reduce((sum, sale) => sum + sale.total, 0);

      setTotalReceived(newTotalReceived);
      setTotalPending(newTotalPending);

      await MySwal.fire({
        title: '¡Venta Pagada!',
        text: 'La venta ha sido marcada como pagada exitosamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al marcar como pagada:', error);
      await MySwal.fire({
        title: 'Error',
        text: 'No se pudo marcar la venta como pagada',
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
      <h1 className="text-3xl font-bold text-primary">Ventas de Hoy</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 space-y-2 rounded-lg shadow-md bg-primary text-primary-foreground">
          <p className="text-md">Total del día</p>
          <h2 className="text-3xl font-bold">
            ${totalDay.toLocaleString()} COP
          </h2>
        </div>

        <div className="p-6 space-y-2 rounded-lg shadow-md bg-green-100 text-green-900">
          <p className="text-md">Total recibido</p>
          <h2 className="text-3xl font-bold">
            ${totalReceived.toLocaleString()} COP
          </h2>
        </div>

       <Link to='/debts'>
         <div className="p-6 space-y-2 rounded-lg shadow-md bg-amber-100 text-amber-900">
          <p className="text-md">Por cobrar</p>
          <h2 className="text-3xl font-bold">
            ${totalPending.toLocaleString()} COP
          </h2>
        </div>
       </Link>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Ventas recientes:</h2>
        <div className="space-y-2">
          {sales.length === 0 ? (
            <p className="text-gray-500">No hay ventas registradas hoy</p>
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
                    <span
                      className={`text-white font-bold text-xs rounded-full px-2 py-1 ${
                        sale.isDebt ? "bg-yellow-500" : "bg-green-500"
                      }`}
                    >
                      {sale.isDebt ? "Fiado" : "Contado"}
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

                  {sale.isDebt && sale.debtDate && (
                    <div className="mt-2 text-sm text-orange-600">
                      <strong>Fecha de deuda:</strong> {new Date(sale.debtDate).toLocaleDateString()}
                    </div>
                  )}

                  {sale.isDebt && (
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
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
