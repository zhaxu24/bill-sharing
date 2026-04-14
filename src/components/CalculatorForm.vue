<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCalculatorStore } from '@/stores/calculatorStore'

const store = useCalculatorStore()

// 表单数据
const formData = ref({
  startDate: '',
  endDate: '',
  selectedPropertyAddress: '',
  allocationMethod: 'area'
})

// 计算属性
const tenants = computed(() => store.tenants)

// 更新表单数据
const updateFormData = (field, value) => {
  formData.value[field] = value
  // 同步到 store
  store[field] = value
}

// 更新账单金额
const updateBillAmount = (id, value) => {
  store.updateBillAmount(id, value)
}

// 更新租户信息
const updateTenant = (tenantId, field, value) => {
  store.updateTenantField(tenantId, field, value)
}

// 操作方法
const addTenant = () => {
  store.addTenant()
}

const removeTenant = (id) => {
  store.removeTenant(id)
}

const addDevice = (tenantId) => {
  store.addDevice(tenantId)
}

const removeDevice = (tenantId, deviceId) => {
  store.removeDevice(tenantId, deviceId)
}

const updateHeatingRoomConsumption = (roomId, value) => {
  store.updateHeatingRoomConsumption(roomId, value)
}

const addHeatingRoomOccupant = (roomId) => {
  store.addHeatingRoomOccupant(roomId)
}

const removeHeatingRoomOccupant = (roomId, occupantId) => {
  store.removeHeatingRoomOccupant(roomId, occupantId)
}

const updateHeatingRoomOccupant = (roomId, occupantId, field, value) => {
  store.updateHeatingRoomOccupantField(roomId, occupantId, field, value)
}

const addHeatingRoom = () => {
  store.addHeatingRoom()
}

const removeHeatingRoom = (roomId) => {
  store.removeHeatingRoom(roomId)
}

const updateHeatingRoomName = (roomId, value) => {
  store.updateHeatingRoomName(roomId, value)
}

// 初始化表单数据
onMounted(() => {
  // 设置默认日期
  if (!store.startDate && !store.endDate) {
    store.setDefaultDates()
  }
  
  formData.value.startDate = store.startDate
  formData.value.endDate = store.endDate
  formData.value.selectedPropertyAddress = store.selectedPropertyAddress
  formData.value.allocationMethod = store.allocationMethod
})
</script>

<template>
  <div class="form-grid">
    <!-- 费用信息 -->
    <div class="form-group">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <label class="mb-0">
          <i class="fas fa-file-invoice-dollar"></i>
          费用信息
        </label>
      </div>
      
      <div class="bill-list">
        <div v-for="bill in store.bills" :key="bill.id" class="bill-item">
          <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
            <label class="form-label">
              <i :class="bill.icon"></i>
              {{ bill.name }} (欧元)
            </label>
            <input 
              type="number" 
              class="form-control form-control-sm" 
              :value="bill.amount" 
              @input="updateBillAmount(bill.id, $event.target.value)"
              min="0" 
              step="0.01"
              placeholder="金额"
            >
          </div>
        </div>
      </div>
      
      <div class="mt-2">
        <div class="alert alert-info mb-0">
          <i class="fas fa-info-circle me-2"></i>
          <small>总费用: <strong>€{{ store.totalBillAmount.toFixed(2) }}</strong></small>
        </div>
      </div>
    </div>
    
    <!-- 起始日期 -->
    <div class="form-group">
      <label for="startDate">
        <i class="fas fa-calendar-alt"></i>
        起始日期
      </label>
      <input 
        id="startDate"
        type="date" 
        class="form-control" 
        :value="formData.startDate" 
        @input="updateFormData('startDate', $event.target.value)"
      >
    </div>
    
    <!-- 结束日期 -->
    <div class="form-group">
      <label for="endDate">
        <i class="fas fa-calendar-check"></i>
        结束日期
      </label>
      <input 
        id="endDate"
        type="date" 
        class="form-control" 
        :value="formData.endDate" 
        @input="updateFormData('endDate', $event.target.value)"
      >
    </div>

    <!-- 房屋地址 -->
    <div class="form-group">
      <label for="selectedPropertyAddress">
        <i class="fas fa-map-marker-alt"></i>
        房屋地址
      </label>
      <select
        id="selectedPropertyAddress"
        class="form-select"
        :value="formData.selectedPropertyAddress"
        @change="updateFormData('selectedPropertyAddress', $event.target.value)"
      >
        <option v-for="address in store.propertyAddressOptions" :key="address" :value="address">
          {{ address }}
        </option>
      </select>
    </div>
  </div>
  
  <!-- 分摊方式 -->
  <div class="form-group">
    <label for="allocationMethod">
      <i class="fas fa-share-alt"></i>
      费用分摊方式
    </label>
    <select 
      id="allocationMethod"
      class="form-select" 
      :value="formData.allocationMethod" 
      @change="updateFormData('allocationMethod', $event.target.value)"
    >
      <option value="time">按居住天数比例分摊</option>
      <option value="heating_room">暖气专用：按房间消耗+租期分摊</option>
    </select>
  </div>
  
  <!-- 租户信息 -->
  <div v-if="formData.allocationMethod !== 'heating_room'" class="form-group">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <label class="mb-0">
        <i class="fas fa-users"></i>
        租户信息
      </label>
      <button class="btn btn-sm btn-secondary" @click="addTenant">
        <i class="fas fa-plus-circle"></i> 添加租户
      </button>
    </div>
    
    <div class="occupant-list">
      <div v-for="tenant in tenants" :key="tenant.id" class="occupant-card">
        <div class="occupant-actions">
          <button 
            class="btn btn-sm btn-danger" 
            @click="removeTenant(tenant.id)" 
            :disabled="tenants.length <= 1"
            title="删除租户"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
        
        <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
          <label class="form-label">姓名</label>
          <input 
            type="text" 
            class="form-control form-control-sm" 
            :value="tenant.name" 
            @input="updateTenant(tenant.id, 'name', $event.target.value)"
            placeholder="租户名称"
          >
        </div>
        
        <div class="form-group mb-0" style="flex: 1; min-width: 120px;">
          <label class="form-label">房间面积 (㎡)</label>
          <input 
            type="number" 
            class="form-control form-control-sm" 
            :value="tenant.roomArea" 
            @input="updateTenant(tenant.id, 'roomArea', $event.target.value)"
            min="1" 
            step="0.1"
            placeholder="面积"
          >
        </div>
        
        <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
          <label class="form-label">居住开始日期</label>
          <input 
            type="date" 
            class="form-control form-control-sm" 
            :value="tenant.occupancyStartDate" 
            @input="updateTenant(tenant.id, 'occupancyStartDate', $event.target.value)"
          >
        </div>

        <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
          <label class="form-label">居住结束日期</label>
          <input 
            type="date" 
            class="form-control form-control-sm" 
            :value="tenant.occupancyEndDate" 
            @input="updateTenant(tenant.id, 'occupancyEndDate', $event.target.value)"
          >
        </div>

        <div class="form-group mb-0" style="flex: 1; min-width: 120px;">
          <label class="form-label">自动计算天数</label>
          <input
            type="number"
            class="form-control form-control-sm"
            :value="tenant.occupancyDays"
            readonly
          >
        </div>
      </div>
    </div>
  </div>
  
  <!-- 电器使用情况 (按设备分摊时显示) -->
  <div v-if="formData.allocationMethod === 'device'" class="form-group">
    <label class="form-label">
      <i class="fas fa-plug"></i>
      电器使用情况
    </label>
    
    <div v-for="tenant in tenants" :key="`device-${tenant.id}`" class="card mb-3">
      <div class="card-body">
        <h5 class="card-title">{{ tenant.name }}的电器</h5>
        
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>电器名称</th>
                <th>功率 (W)</th>
                <th>日均使用时长 (小时)</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="device in tenant.devices" :key="device.id">
                <td>
                  <input 
                    type="text" 
                    class="form-control form-control-sm" 
                    :value="device.name" 
                    @input="device.name = $event.target.value"
                    placeholder="电器名称"
                  >
                </td>
                <td>
                  <input 
                    type="number" 
                    class="form-control form-control-sm" 
                    :value="device.power" 
                    @input="device.power = $event.target.value"
                    min="1"
                    placeholder="功率"
                  >
                </td>
                <td>
                  <input 
                    type="number" 
                    class="form-control form-control-sm" 
                    :value="device.usageHours" 
                    @input="device.usageHours = $event.target.value"
                    min="0" 
                    step="0.5" 
                    max="24"
                    placeholder="时长"
                  >
                </td>
                <td>
                  <button class="btn btn-sm btn-danger" @click="removeDevice(tenant.id, device.id)">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <button class="btn btn-sm btn-secondary" @click="addDevice(tenant.id)">
          <i class="fas fa-plus-circle"></i> 添加电器
        </button>
      </div>
    </div>
  </div>
  
  <!-- 自定义分摊比例 (自定义分摊时显示) -->
  <div v-if="formData.allocationMethod === 'custom'" class="form-group">
    <label class="form-label">
      <i class="fas fa-sliders-h"></i>
      自定义分摊比例
    </label>
    
    <div class="card">
      <div class="card-body">
        <div v-for="(tenant, index) in tenants" :key="`ratio-${tenant.id}`" class="mb-3">
          <div class="d-flex align-items-center">
            <span class="me-3 fw-bold" style="min-width: 80px;">{{ tenant.name }}</span>
            <input 
              type="range" 
              class="form-range me-3" 
              :value="store.customRatios[index] * 100" 
              @input="store.customRatios[index] = $event.target.value / 100"
              min="0" 
              max="100"
            >
            <span style="min-width: 50px;">{{ Math.round(store.customRatios[index] * 100) }}%</span>
          </div>
        </div>
        
        <div class="alert alert-info mb-0">
          <i class="fas fa-info-circle me-2"></i>
          <small>系统会自动将比例调整为总和100%</small>
        </div>
      </div>
    </div>
  </div>

  <!-- 暖气专用分摊输入 -->
  <div v-if="formData.allocationMethod === 'heating_room'" class="form-group">
    <label class="form-label">
      <i class="fas fa-fire"></i>
      暖气专用输入（按房间）
    </label>

    <div class="card mb-3">
      <div class="card-body">
        <div class="form-group mb-0" style="max-width: 320px;">
          <label class="form-label">公共区域暖气消耗（份）</label>
          <input
            type="number"
            class="form-control form-control-sm"
            :value="store.heatingCommonConsumption"
            @input="store.heatingCommonConsumption = $event.target.value"
            min="0"
            step="0.01"
            placeholder="例如 40"
          >
        </div>
      </div>
    </div>

    <div class="d-flex justify-content-end mb-2">
      <button class="btn btn-sm btn-secondary" @click="addHeatingRoom">
        <i class="fas fa-plus-circle"></i> 添加房间
      </button>
    </div>

    <div v-for="room in store.heatingRooms" :key="`room-${room.id}`" class="card mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center gap-2">
            <label class="form-label mb-0">房间名称</label>
            <input
              type="text"
              class="form-control form-control-sm"
              style="width: 140px;"
              :value="room.name"
              @input="updateHeatingRoomName(room.id, $event.target.value)"
            >
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-secondary" @click="addHeatingRoomOccupant(room.id)">
              <i class="fas fa-plus-circle"></i> 添加租客时段
            </button>
            <button class="btn btn-sm btn-danger" @click="removeHeatingRoom(room.id)" :disabled="store.heatingRooms.length <= 1">
              <i class="fas fa-trash"></i> 删除房间
            </button>
          </div>
        </div>

        <div class="form-group mb-3" style="max-width: 320px;">
          <label class="form-label">房间暖气消耗（份）</label>
          <input
            type="number"
            class="form-control form-control-sm"
            :value="room.consumption"
            @input="updateHeatingRoomConsumption(room.id, $event.target.value)"
            min="0"
            step="0.01"
            placeholder="例如 120"
          >
        </div>

        <div v-for="occupant in room.occupants" :key="`occ-${room.id}-${occupant.id}`" class="occupant-card mb-2">
          <div class="occupant-actions">
            <button
              class="btn btn-sm btn-danger"
              @click="removeHeatingRoomOccupant(room.id, occupant.id)"
              :disabled="room.occupants.length <= 1"
              title="删除租客时段"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>

          <div class="form-group mb-0" style="flex: 1; min-width: 140px;">
            <label class="form-label">租客名称</label>
            <input
              type="text"
              class="form-control form-control-sm"
              :value="occupant.tenantName"
              @input="updateHeatingRoomOccupant(room.id, occupant.id, 'tenantName', $event.target.value)"
              placeholder="例如 a1"
            >
          </div>

          <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
            <label class="form-label">开始日期</label>
            <input
              type="date"
              class="form-control form-control-sm"
              :value="occupant.startDate"
              @input="updateHeatingRoomOccupant(room.id, occupant.id, 'startDate', $event.target.value)"
            >
          </div>

          <div class="form-group mb-0" style="flex: 1; min-width: 150px;">
            <label class="form-label">结束日期</label>
            <input
              type="date"
              class="form-control form-control-sm"
              :value="occupant.endDate"
              @input="updateHeatingRoomOccupant(room.id, occupant.id, 'endDate', $event.target.value)"
            >
          </div>

          <div class="form-group mb-0" style="flex: 1; min-width: 120px;">
            <label class="form-label">天数</label>
            <input
              type="number"
              class="form-control form-control-sm"
              :value="occupant.occupancyDays"
              readonly
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-control, .form-select {
  font-size: 1rem;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}

.dark-mode .form-control, 
.dark-mode .form-select {
  background-color: #334155;
  border-color: #475569;
  color: white;
}

.form-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.bill-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  position: relative;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.dark-mode .bill-item {
  background: #334155;
  border-color: #475569;
}

.bill-item:hover {
  transform: translateX(5px);
  border-color: var(--primary-color);
}

.bill-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
}

.occupant-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  position: relative;
  transition: all 0.3s ease;
}

.dark-mode .occupant-card {
  background: #334155;
  border-color: #475569;
}

.occupant-card:hover {
  transform: translateX(5px);
  border-color: var(--primary-color);
}

.occupant-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .bill-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .bill-actions {
    position: absolute;
    top: 10px;
    right: 10px;
  }
  
  .occupant-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .occupant-actions {
    position: absolute;
    top: 10px;
    right: 10px;
  }
}
</style>