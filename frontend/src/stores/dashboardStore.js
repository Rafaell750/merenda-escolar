import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDashboardStore = defineStore('dashboard', () => {
  const dashboardData = ref(null)
  const loading = ref(false)
  const error = ref(null)



  const fetchDashboardData = async () => {
    loading.value = true
    try {
      // Aqui você fará a chamada real à API quando estiver pronto
      // const response = await axios.get('/api/dashboard')
      // dashboardData.value = response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return { 
    dashboardData, 
    loading, 
    error, 
    fetchDashboardData,
    totalProducts,
    lowStockItems,
    expiringSoon,
    lastMovements,
    alerts
  }
})