import { defineStore } from 'pinia'

export const useCalculatorStore = defineStore('calculator', {
  state: () => ({
    // 费用基础数据
    bills: [
      { id: 'electricity', name: '电费', icon: 'fas fa-bolt', amount: 0 },
      { id: 'water', name: '水费', icon: 'fas fa-tint', amount: 0 },
      { id: 'heating', name: '暖气费', icon: 'fas fa-fire', amount: 0 }
    ],
    startDate: '',
    endDate: '',
    propertyAddressOptions: [
      'Geschwister-Scholl Strasse 6, 91058, Erlangen',
      'Hertleinstrasse 37, 91052, Erlangen',
      'Froebelstrasse 11, 91058, Erlangen'
    ],
    selectedPropertyAddress: 'Geschwister-Scholl Strasse 6, 91058, Erlangen',
    heatingCommonConsumption: 0,
    heatingRooms: [
      {
        id: 'A',
        name: 'A',
        consumption: 0,
        occupants: [{ id: 1, tenantName: 'a1', startDate: '', endDate: '', occupancyDays: 0 }]
      },
      {
        id: 'B',
        name: 'B',
        consumption: 0,
        occupants: [{ id: 1, tenantName: 'b1', startDate: '', endDate: '', occupancyDays: 0 }]
      },
      {
        id: 'C',
        name: 'C',
        consumption: 0,
        occupants: [{ id: 1, tenantName: 'c1', startDate: '', endDate: '', occupancyDays: 0 }]
      },
      {
        id: 'D',
        name: 'D',
        consumption: 0,
        occupants: [{ id: 1, tenantName: 'd1', startDate: '', endDate: '', occupancyDays: 0 }]
      }
    ],
    
    // 租户信息
    tenants: [
      { id: 1, name: '租户1', roomArea: 15, occupancyStartDate: '', occupancyEndDate: '', occupancyDays: 30, devices: [] },
      { id: 2, name: '租户2', roomArea: 12, occupancyStartDate: '', occupancyEndDate: '', occupancyDays: 30, devices: [] }
    ],
    
    // 分摊设置
    allocationMethod: 'time', // 'time', 'heating_room'
    customRatios: [0.5, 0.5],
    calculationHistory: [],
    
    // 计算结果
    calculationResult: null
  }),
  
  getters: {
    totalArea: (state) => {
      return state.tenants.reduce((sum, tenant) => sum + parseFloat(tenant.roomArea || 0), 0)
    },
    
    totalOccupancyDays: (state) => {
      return state.tenants.reduce((sum, tenant) => sum + parseInt(tenant.occupancyDays || 0), 0)
    },
    
    // 获取总费用
    totalBillAmount: (state) => {
      return state.bills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0)
    },

    utilityBillAmount: (state) => {
      return state.bills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0)
    }
  },
  
  actions: {
    // 添加费用类型
    addBillType() {
      const nextId = `custom_${Date.now()}`
      this.bills.push({
        id: nextId,
        name: `费用${this.bills.length + 1}`,
        icon: 'fas fa-file-invoice-dollar',
        amount: 0
      })
    },
    
    // 删除费用类型
    removeBillType(id) {
      if (this.bills.length <= 1) return
      this.bills = this.bills.filter(bill => bill.id !== id)
    },
    
    // 更新费用金额
    updateBillAmount(id, amount) {
      const bill = this.bills.find(bill => bill.id === id)
      if (bill) {
        bill.amount = amount
      }
    },
    
    // 添加租户
    addTenant() {
      const newId = this.tenants.length > 0 ? Math.max(...this.tenants.map(t => t.id)) + 1 : 1
      const defaultStartDate = this.startDate || ''
      const defaultEndDate = this.endDate || ''
      this.tenants.push({
        id: newId,
        name: `租户${this.tenants.length + 1}`,
        roomArea: 10,
        occupancyStartDate: defaultStartDate,
        occupancyEndDate: defaultEndDate,
        occupancyDays: this.calculateDaysBetween(defaultStartDate, defaultEndDate),
        devices: []
      })
      
      // 扩展自定义比例数组
      this.customRatios.push(0)
    },

    // 更新租户字段
    updateTenantField(tenantId, field, value) {
      const tenant = this.tenants.find(t => t.id === tenantId)
      if (!tenant) return

      tenant[field] = value

      if (field === 'occupancyStartDate' || field === 'occupancyEndDate') {
        tenant.occupancyDays = this.calculateDaysBetween(tenant.occupancyStartDate, tenant.occupancyEndDate)
      }
    },

    updateHeatingRoomConsumption(roomId, value) {
      const room = this.heatingRooms.find(r => r.id === roomId)
      if (!room) return
      room.consumption = value
    },

    addHeatingRoomOccupant(roomId) {
      const room = this.heatingRooms.find(r => r.id === roomId)
      if (!room) return

      const nextId = room.occupants.length > 0
        ? Math.max(...room.occupants.map(o => o.id)) + 1
        : 1

      const startDate = this.startDate || ''
      const endDate = this.endDate || ''
      room.occupants.push({
        id: nextId,
        tenantName: `${room.name.toLowerCase()}${room.occupants.length + 1}`,
        startDate,
        endDate,
        occupancyDays: this.calculateDaysBetween(startDate, endDate)
      })
    },

    removeHeatingRoomOccupant(roomId, occupantId) {
      const room = this.heatingRooms.find(r => r.id === roomId)
      if (!room || room.occupants.length <= 1) return
      room.occupants = room.occupants.filter(o => o.id !== occupantId)
    },

    updateHeatingRoomOccupantField(roomId, occupantId, field, value) {
      const room = this.heatingRooms.find(r => r.id === roomId)
      if (!room) return
      const occupant = room.occupants.find(o => o.id === occupantId)
      if (!occupant) return

      occupant[field] = value
      if (field === 'startDate' || field === 'endDate') {
        occupant.occupancyDays = this.calculateDaysBetween(occupant.startDate, occupant.endDate)
      }
    },

    addHeatingRoom() {
      const roomNumber = this.heatingRooms.length + 1
      const roomId = `room_${Date.now()}_${roomNumber}`
      const startDate = this.startDate || ''
      const endDate = this.endDate || ''
      this.heatingRooms.push({
        id: roomId,
        name: `房间${roomNumber}`,
        consumption: 0,
        occupants: [{
          id: 1,
          tenantName: `r${roomNumber}a1`,
          startDate,
          endDate,
          occupancyDays: this.calculateDaysBetween(startDate, endDate)
        }]
      })
    },

    removeHeatingRoom(roomId) {
      if (this.heatingRooms.length <= 1) return
      this.heatingRooms = this.heatingRooms.filter(room => room.id !== roomId)
    },

    updateHeatingRoomName(roomId, value) {
      const room = this.heatingRooms.find(r => r.id === roomId)
      if (!room) return
      room.name = value
    },

    // 计算日期区间天数（包含起止日期）
    calculateDaysBetween(startDate, endDate) {
      if (!startDate || !endDate) return 0

      const start = new Date(startDate)
      const end = new Date(endDate)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0

      const oneDay = 1000 * 60 * 60 * 24
      return Math.floor((end - start) / oneDay) + 1
    },
    
    // 删除租户
    removeTenant(id) {
      if (this.tenants.length > 1) {
        this.tenants = this.tenants.filter(tenant => tenant.id !== id)
        // 同步删除自定义比例
        this.customRatios.pop()
      }
    },
    
    // 添加设备
    addDevice(tenantId) {
      const tenant = this.tenants.find(t => t.id === tenantId)
      if (tenant) {
        tenant.devices.push({
          id: Date.now(),
          name: '电器' + (tenant.devices.length + 1),
          power: 100,
          usageHours: 5
        })
      }
    },
    
    // 删除设备
    removeDevice(tenantId, deviceId) {
      const tenant = this.tenants.find(t => t.id === tenantId)
      if (tenant) {
        tenant.devices = tenant.devices.filter(d => d.id !== deviceId)
      }
    },
    
    // 设置默认日期
    setDefaultDates() {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      this.startDate = firstDay.toISOString().split('T')[0];
      this.endDate = lastDay.toISOString().split('T')[0];

      this.tenants.forEach(tenant => {
        if (!tenant.occupancyStartDate) {
          tenant.occupancyStartDate = this.startDate
        }
        if (!tenant.occupancyEndDate) {
          tenant.occupancyEndDate = this.endDate
        }
        tenant.occupancyDays = this.calculateDaysBetween(tenant.occupancyStartDate, tenant.occupancyEndDate)
      })

      this.heatingRooms.forEach(room => {
        room.occupants.forEach(occupant => {
          if (!occupant.startDate) occupant.startDate = this.startDate
          if (!occupant.endDate) occupant.endDate = this.endDate
          occupant.occupancyDays = this.calculateDaysBetween(occupant.startDate, occupant.endDate)
        })
      })
    },
    
    // 验证输入数据
    validateInput() {
      // 验证必要字段
      if (!this.startDate || !this.endDate) return false
      if (new Date(this.startDate) >= new Date(this.endDate)) return false
      if (!this.selectedPropertyAddress) return false
      
      if (this.totalBillAmount <= 0) return false

      if (this.allocationMethod === 'heating_room') {
        if (parseFloat(this.heatingCommonConsumption || 0) < 0) return false
        if (!Array.isArray(this.heatingRooms) || this.heatingRooms.length === 0) return false
        for (const room of this.heatingRooms) {
          if (!room.name) return false
          if (parseFloat(room.consumption || 0) < 0) return false
          if (!Array.isArray(room.occupants) || room.occupants.length === 0) return false
          for (const occupant of room.occupants) {
            if (!occupant.tenantName) return false
            if (!occupant.startDate || !occupant.endDate) return false
            if (new Date(occupant.startDate) > new Date(occupant.endDate)) return false
            if (!occupant.occupancyDays || parseInt(occupant.occupancyDays) <= 0) return false
          }
        }
        return true
      }

      // 按居住天数分摊：按房间 + 房间内租期
      if (!Array.isArray(this.heatingRooms) || this.heatingRooms.length === 0) return false
      for (const room of this.heatingRooms) {
        if (!room.name) return false
        if (!Array.isArray(room.occupants) || room.occupants.length === 0) return false
        for (const occupant of room.occupants) {
          if (!occupant.tenantName) return false
          if (!occupant.startDate || !occupant.endDate) return false
          if (new Date(occupant.startDate) > new Date(occupant.endDate)) return false
          if (!occupant.occupancyDays || parseInt(occupant.occupancyDays) <= 0) return false
        }
      }
      
      return true
    },
    
    // 计算费用分摊
    calculateAllocation() {
      if (!this.validateInput()) {
        return { success: false, message: '请填写所有必填字段，并确保起始日期早于结束日期。' }
      }
      
      const result = {
        allocationDetails: [],
        billBreakdown: [],
        billTypeSummary: [],
        totalBill: 0,
        calculationDate: new Date().toISOString()
      }

      let targetBills = []
      if (this.allocationMethod === 'heating_room') {
        result.allocationDetails = this.calculateByHeatingRoom()
        result.totalBill = this.totalBillAmount
        targetBills = this.bills
      } else {
        result.allocationDetails = this.calculateByTime(this.totalBillAmount)
        result.totalBill = this.totalBillAmount
        targetBills = this.bills
      }

      const { billBreakdown, billTypeSummary } = this.calculateBillBreakdown(result.allocationDetails, targetBills)
      result.billBreakdown = billBreakdown
      result.billTypeSummary = billTypeSummary
      
      // 保存计算结果
      this.calculationResult = result
      
      // 保存到历史记录
      this.saveToHistory(result)
      
      return { success: true }
    },

    calculateByHeatingRoom() {
      const roomCount = this.heatingRooms.length || 1
      const commonPerRoom = parseFloat(this.heatingCommonConsumption || 0) / roomCount
      const totalShares = this.heatingRooms.reduce((sum, room) => {
        return sum + parseFloat(room.consumption || 0)
      }, 0) + parseFloat(this.heatingCommonConsumption || 0)

      if (totalShares <= 0) return this.calculateByTime(this.totalBillAmount)

      const unitPrice = this.totalBillAmount / totalShares
      const tenantMap = new Map()

      this.heatingRooms.forEach(room => {
        const roomShares = parseFloat(room.consumption || 0) + commonPerRoom
        const roomCost = roomShares * unitPrice
        const roomDays = room.occupants.reduce((sum, o) => sum + parseInt(o.occupancyDays || 0), 0)
        const safeRoomDays = roomDays > 0 ? roomDays : 1

        room.occupants.forEach(occupant => {
          const ratioInRoom = parseInt(occupant.occupancyDays || 0) / safeRoomDays
          const amount = roomCost * ratioInRoom
          const key = occupant.tenantName.trim()

          if (!tenantMap.has(key)) {
            tenantMap.set(key, {
              tenantName: key,
              amount: 0,
              roomDetails: []
            })
          }

          const item = tenantMap.get(key)
          item.amount += amount
          item.roomDetails.push(`${room.name}房 ${occupant.startDate}~${occupant.endDate} (${occupant.occupancyDays}天)`)
        })
      })

      return Array.from(tenantMap.values()).map((item, idx) => ({
        tenantId: idx + 1,
        tenantName: item.tenantName,
        amount: item.amount,
        ratio: this.totalBillAmount > 0 ? item.amount / this.totalBillAmount : 0,
        allocationBasis: '按房间暖气+租期分配',
        details: item.roomDetails.join('；')
      }))
    },

    // 按费用类型拆分每个租户应缴金额
    calculateBillBreakdown(allocationDetails, targetBills) {
      const billBreakdown = allocationDetails.map(item => {
        const breakdown = targetBills.map(bill => ({
          billId: bill.id,
          billName: bill.name,
          amount: parseFloat(bill.amount || 0) * item.ratio
        }))

        const subtotal = breakdown.reduce((sum, row) => sum + row.amount, 0)
        return {
          tenantId: item.tenantId,
          tenantName: item.tenantName,
          breakdown,
          subtotal
        }
      })

      const billTypeSummary = targetBills.map(bill => {
        const totalAllocated = billBreakdown.reduce((sum, tenantItem) => {
          const target = tenantItem.breakdown.find(row => row.billId === bill.id)
          return sum + (target ? target.amount : 0)
        }, 0)

        return {
          billId: bill.id,
          billName: bill.name,
          totalAmount: parseFloat(bill.amount || 0),
          totalAllocated
        }
      })

      return { billBreakdown, billTypeSummary }
    },
    
    // 按时间分摊（按房间平均，再在房间内按租期）
    calculateByTime(targetAmount = this.utilityBillAmount) {
      const roomCount = this.heatingRooms.length || 1
      const roomCost = targetAmount / roomCount
      const tenantMap = new Map()

      this.heatingRooms.forEach(room => {
        const totalRoomDays = room.occupants.reduce((sum, o) => sum + parseInt(o.occupancyDays || 0), 0)
        const safeRoomDays = totalRoomDays > 0 ? totalRoomDays : 1

        room.occupants.forEach(occupant => {
          const inRoomRatio = parseInt(occupant.occupancyDays || 0) / safeRoomDays
          const amount = roomCost * inRoomRatio
          const key = occupant.tenantName.trim()

          if (!tenantMap.has(key)) {
            tenantMap.set(key, { tenantName: key, amount: 0, roomDetails: [] })
          }
          const item = tenantMap.get(key)
          item.amount += amount
          item.roomDetails.push(`${room.name}房 ${occupant.startDate}~${occupant.endDate} (${occupant.occupancyDays}天)`)
        })
      })

      return Array.from(tenantMap.values()).map((item, idx) => ({
        tenantId: idx + 1,
        tenantName: item.tenantName,
        amount: item.amount,
        ratio: targetAmount > 0 ? item.amount / targetAmount : 0,
        allocationBasis: '按房间平均+租期分配',
        details: item.roomDetails.join('；')
      }))
    },
    
    // 保存到历史记录
    saveToHistory(result) {
      const historyEntry = {
        id: Date.now(),
        dateRange: `${this.startDate} 至 ${this.endDate}`,
        propertyAddress: this.selectedPropertyAddress,
        totalBill: result.totalBill,
        bills: [...this.bills],
        heatingCommonConsumption: this.heatingCommonConsumption,
        heatingRooms: JSON.parse(JSON.stringify(this.heatingRooms)),
        allocationMethod: this.allocationMethod,
        details: result.allocationDetails,
        billBreakdown: result.billBreakdown,
        billTypeSummary: result.billTypeSummary,
        calculationDate: new Date().toLocaleString()
      }
      
      this.calculationHistory.unshift(historyEntry)
      // 限制历史记录数量
      if (this.calculationHistory.length > 10) {
        this.calculationHistory.pop()
      }
      
      // 保存到 localStorage
      localStorage.setItem('electricityCalculationHistory', JSON.stringify(this.calculationHistory))
    },
    
    // 清除结果
    clearResults() {
      this.calculationResult = null
    }
  }
})