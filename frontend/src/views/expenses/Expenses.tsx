import { useEffect, useState } from "react";
import expenseService from "../../services/expense.service";
import { categoryLabels, type Expense, type ExpenseCategory } from "../../models/expense.model";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  Search,
  Plus,
  DollarSign,
  Trash2,
  Receipt,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { screenWidth } from "../../utils/screen-width.util";

const MySwal = withReactContent(Swal);

// Helper para formatear fechas UTC correctamente (evita problemas de timezone)
const formatDateUTC = (date: Date | string, locale: string = 'es-CO'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // Usar UTC para mostrar la fecha correcta sin conversión de timezone
  return dateObj.toLocaleDateString(locale, {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Helper para generar options del select dinámicamente
const getCategoryOptions = () => {
  const categories: ExpenseCategory[] = [
    'pollo', 'combos', 'acompanantes', 'salsas', 'cerdo',
    'pasteles', 'bebidas', 'adicionales', 'insumos', 'delivery', 'otros'
  ];
  
  return categories
    .map(category => `<option value="${category}">${categoryLabels[category]}</option>`)
    .join('');
};

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para filtrado y estadísticas
  const [filterType, setFilterType] = useState<'all' | 'today' | 'range'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<{ category: string; total: number }[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    loadExpenses();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const expensesData = await expenseService.getAllExpenses();
      setExpenses(expensesData);
      loadStats();
    } catch (error) {
      console.error("Error loading expenses:", error);
      setError("No se pudieron cargar los gastos");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [total, byCategory, todayExpenses] = await Promise.all([
        expenseService.getTotalExpenses(),
        expenseService.getTotalByCategory(),
        expenseService.getTodayExpenses()
      ]);
      
      setTotalExpenses(total);
      setCategoryTotals(byCategory);
      setTodayTotal(todayExpenses.reduce((sum, exp) => sum + exp.amount, 0));
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleFilterChange = async (type: 'all' | 'today' | 'range') => {
    setFilterType(type);
    
    // Solo ejecutar búsqueda si no es 'range' o si ya hay fechas para 'range'
    if (type === 'range' && (!startDate || !endDate)) {
      return; // No hacer nada hasta que se seleccionen fechas
    }
    
    setIsLoading(true);
    
    try {
      let expensesData: Expense[] = [];
      
      switch (type) {
        case 'today':
          expensesData = await expenseService.getTodayExpenses();
          break;
        case 'range':
          if (startDate && endDate) {
            // Enviar fechas en formato YYYY-MM-DD como espera el controller
            console.log('Fechas enviadas:', {
              startDate,
              endDate
            });
            
            expensesData = await expenseService.getExpensesByDateRange(
              new Date(startDate),
              new Date(endDate)
            );
          } else {
            MySwal.fire({
              title: 'Error',
              text: 'Por favor selecciona un rango de fechas',
              icon: 'warning'
            });
            setFilterType('all');
            expensesData = await expenseService.getAllExpenses();
          }
          break;
        default:
          expensesData = await expenseService.getAllExpenses();
      }
      
      setExpenses(expensesData);
    } catch (error) {
      console.error("Error filtering expenses:", error);
      setError("No se pudieron filtrar los gastos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    if (startDate && endDate && filterType === 'range') {
      handleFilterChange('range');
    }
  };

  const handleShowStats = () => {
    setShowStats(!showStats);
  };

  const handleCreateExpense = async () => {
    const { value: formValues } = await MySwal.fire({
      title: "Nuevo Gasto",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción del Gasto</label>
            <input id="swal-description" style="margin: 0px; width: 100%;" class="swal2-input" placeholder="Ej: Arriendo local mensual" list="expense-suggestions" autocomplete="off">
            <datalist id="expense-suggestions">
              <option value="Compra de pollos">
              <option value="Carbón o leña">
              <option value="Papa">
              <option value="Yuca">
              <option value="Arroz">
              <option value="Cerdo">
              <option value="Pasteles de arroz">
              <option value="Salsas (ajo, BBQ, piña)">
              <option value="Aceite de cocina">
              <option value="Condimentos y especias">
              <option value="Bolsas y empaques">
              <option value="Envases y platos desechables">
              <option value="Servilletas">
              <option value="Insumos de limpieza">
              <option value="Gas">
              <option value="Energía eléctrica">
              <option value="Agua">
              <option value="Pago ayudante o asador">
              <option value="Domicilios">
              <option value="Mantenimiento del asador">
              <option value="Otros gastos">
            </datalist>

          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select id="swal-category" style="margin: 0px; width: 100%;" class="swal2-select">
              <option value="" selected disabled>Selecciona una categoría...</option>
              ${getCategoryOptions()}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Monto</label>
            <input id="swal-amount" style="margin: 0px; width: 100%;" type="number" class="swal2-input" placeholder="0.00">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input id="swal-date" style="margin: 0px; width: 100%;" type="date" class="swal2-input">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea id="swal-notes" style="margin: 0px; width: 100%;" class="swal2-textarea" rows="3" placeholder="Detalles adicionales..."></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Registrar Gasto",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const description = (
          document.getElementById("swal-description") as HTMLInputElement
        ).value;
        const category = (
          document.getElementById("swal-category") as HTMLSelectElement
        ).value;
        const amount = (
          document.getElementById("swal-amount") as HTMLInputElement
        ).value;
        const date = (document.getElementById("swal-date") as HTMLInputElement)
          .value;
        const notes = (
          document.getElementById("swal-notes") as HTMLTextAreaElement
        ).value;

        if (!description || !category || !amount || !date) {
          MySwal.showValidationMessage(
            "Por favor completa los campos obligatorios",
          );
          return false;
        }

        return {
          description,
          category,
          amount: Number(amount),
          date: date,
          notes,
        };
      },
      didOpen: () => {
        // Set today's date as default
        const today = new Date().toISOString().split("T")[0];
        (document.getElementById("swal-date") as HTMLInputElement).value =
          today;

        // Auto-select category based on description when user types
        const descriptionInput = document.getElementById(
          "swal-description",
        ) as HTMLInputElement;
        const categorySelect = document.getElementById(
          "swal-category",
        ) as HTMLSelectElement;

        const categoryMap: { [key: string]: string } = {
          "compra de pollos": "pollo",
          "carbón o leña": "pollo",
          "papa": "acompanantes",
          "yuca": "acompanantes",
          "arroz": "acompanantes",
          "cerdo": "cerdo",
          "pasteles de arroz": "pasteles",
          "salsas": "salsas",
          "aceite de cocina": "insumos",
          "condimentos y especias": "insumos",
          "bolsas y empaques": "insumos",
          "envases y platos desechables": "insumos",
          "servilletas": "insumos",
          "insumos de limpieza": "insumos",
          "gas": "insumos",
          "energía eléctrica": "insumos",
          "agua": "insumos",
          "pago ayudante o asador": "otros",
          "domicilios": "delivery",
          "mantenimiento del asador": "otros",
          "otros gastos": "otros"
        };

        descriptionInput.addEventListener("input", () => {
          const inputText = descriptionInput.value.toLowerCase();
          const matchedCategory = Object.keys(categoryMap).find(
            (key) =>
              key.toLowerCase().includes(inputText) ||
              inputText.includes(key.toLowerCase()),
          );

          if (matchedCategory) {
            categorySelect.value = categoryMap[matchedCategory];
          }
        });
      },
    });

    if (formValues) {
      try {
        const newExpense = await expenseService.createExpense({
          description: formValues.description,
          category: formValues.category,
          amount: formValues.amount,
          date: formValues.date,
          notes: formValues.notes
        });
        setExpenses([...expenses, newExpense]);

        MySwal.fire({
          title: "¡Registrado!",
          text: "El gasto ha sido registrado correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        MySwal.fire({
          title: "Error",
          text: "No se pudo registrar el gasto",
          icon: "error",
        });
        console.error("Error creating expense:", error);
      }
    }
  };

  const handleViewExpense = (expense: Expense) => {
    MySwal.fire({
      title: "Detalle del Gasto",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <p class="text-lg font-semibold">${expense.description}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <p class="text-sm capitalize">${categoryLabels[expense.category as keyof typeof categoryLabels] || expense.category}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <p class="text-sm">${formatDateUTC(expense.date)}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Monto</label>
            <p class="text-lg font-bold text-red-600">$${expense.amount.toLocaleString()} COP</p>
          </div>
          
          ${
            expense.notes
              ? `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <p class="text-sm">${expense.notes}</p>
          </div>
          `
              : ""
          }
        </div>
      `,
      icon: "info",
      confirmButtonText: "Cerrar",
    });
  };

  const handleDeleteExpense = async (expense: Expense) => {
    const result = await MySwal.fire({
      title: "¿Eliminar Gasto?",
      text: `¿Estás seguro de eliminar "${expense.description}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444",
    });

    if (result.isConfirmed) {
      try {
        await expenseService.deleteExpense(expense._id);
        setExpenses(expenses.filter((e) => e._id !== expense._id));
        MySwal.fire({
          title: "¡Eliminado!",
          text: "El gasto ha sido eliminado",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        MySwal.fire({
          title: "Error",
          text: "No se pudo eliminar el gasto",
          icon: "error",
        });
        console.error("Error deleting expense:", error);
      }
    }
  };

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getTotalExpenses = () => {
    return filteredExpenses.reduce(
      (total, expense) => total + expense.amount,
      0,
    );
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
          onClick={loadExpenses}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-primary mb-4 md:mb-0">Gastos</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleShowStats}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Estadísticas</span>
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Filter className="w-4 h-4" />
            { screenWidth.isMobile ?? <span>Filtros</span>}
          </button>

          <button
            onClick={handleCreateExpense}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Nuevo Gasto</span>
          </button>
        </div>
      </div>

      {/* Panel de Filtros */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Filtrar Gastos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Filtro</label>
              <select
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value as 'all' | 'today' | 'range')}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos los gastos</option>
                <option value="today">Gastos de hoy</option>
                <option value="range">Por rango de fechas</option>
              </select>
            </div>
            
            {filterType === 'range' && (
              <>
                <div className="md:col-span-3">
                  <p className="text-sm text-blue-600 mb-2 font-medium">
                    � Selecciona las fechas para aplicar el filtro automáticamente
                  </p>
                  {!startDate && !endDate && (
                    <p className="text-xs text-gray-500 mb-2">
                      Elige una fecha de inicio y fin para ver los gastos en ese período
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button onClick={handleDateRangeChange} className="bg-primary text-white px-4 py-2 rounded-lg h-max self-end cursor-pointer">
                  Aplicar Filtro
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Panel de Estadísticas */}
      {showStats && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Estadísticas de Gastos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Total General</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                ${totalExpenses.toLocaleString()} COP
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Gastos de Hoy</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${todayTotal.toLocaleString()} COP
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Receipt className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Total Gastos</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {expenses.length}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-semibold mb-3">Totales por Categoría</h4>
            <div className="space-y-2">
              {categoryTotals.map((cat) => (
                <div key={cat.category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="capitalize font-medium">
                    {categoryLabels[cat.category as keyof typeof categoryLabels] || cat.category}
                  </span>
                  <span className="font-bold text-red-600">
                    ${cat.total.toLocaleString()} COP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por descripción o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center">

          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold">
              {filteredExpenses.length} gasto
              {filteredExpenses.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            <span className="text-lg font-bold text-red-600">
              Total: {getTotalExpenses().toLocaleString()} COP
            </span>
          </div>

        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="text-center p-8">
          <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm
              ? "No se encontraron gastos"
              : "No hay gastos registrados"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.map((expense) => (
            <div
              key={expense._id}
              className="p-4 border rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:bg-primary/10 transform hover:scale-105 cursor-pointer"
              onClick={() => handleViewExpense(expense)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{expense.description}</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteExpense(expense);
                    }}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDateUTC(expense.date)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Receipt className="w-3 h-3" />
                  <span className="capitalize">{expense.category}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {expense.notes
                    ? `${expense.notes.substring(0, 30)}...`
                    : "Sin notas"}
                </span>
                <span className="text-lg font-bold text-red-600">
                  ${expense.amount.toLocaleString()} COP
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
