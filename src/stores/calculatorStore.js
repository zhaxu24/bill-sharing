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
      return state.bills
        .filter(bill => bill.id === 'electricity' || bill.id === 'water')
        .reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0)
    },

    heatingBillAmount: (state) => {
      const heating = state.bills.find(bill => bill.id === 'heating')
      return parseFloat(heating?.amount || 0)
    }
  },
  
  actions: {
    // 添加费用类型
    addBillType() {
      // Simplified mode: fixed bill types (electricity, water, heating)
    },
    
    // 删除费用类型
    removeBillType(id) {
      // Simplified mode: fixed bill types (electricity, water, heating)
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
      
      if (this.allocationMethod === 'heating_room') {
        if (this.heatingBillAmount <= 0) return false
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

      if (this.utilityBillAmount <= 0) return false

      // 验证租户数据
      if (this.tenants.length === 0) return false
      for (const tenant of this.tenants) {
        if (!tenant.name) return false
        if (!tenant.roomArea || parseFloat(tenant.roomArea) <= 0) return false
        if (!tenant.occupancyStartDate || !tenant.occupancyEndDate) return false
        if (new Date(tenant.occupancyStartDate) > new Date(tenant.occupancyEndDate)) return false
        if (!tenant.occupancyDays || parseInt(tenant.occupancyDays) <= 0) return false
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
        result.totalBill = this.heatingBillAmount
        targetBills = this.bills.filter(bill => bill.id === 'heating')
      } else {
        result.allocationDetails = this.calculateByTime(this.utilityBillAmount)
        result.totalBill = this.utilityBillAmount
        targetBills = this.bills.filter(bill => bill.id === 'electricity' || bill.id === 'water')
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

      if (totalShares <= 0) return this.calculateByTime(this.heatingBillAmount)

      const unitPrice = this.heatingBillAmount / totalShares
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
        ratio: this.heatingBillAmount > 0 ? item.amount / this.heatingBillAmount : 0,
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
    
    // 按面积分摊
    calculateByArea() {
      return this.tenants.map(tenant => {
        const areaRatio = parseFloat(tenant.roomArea) / this.totalArea
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          amount: this.totalBillAmount * areaRatio,
          ratio: areaRatio,
          allocationBasis: '按面积分配',
          details: `房间面积: ${tenant.roomArea}平方米 (占比${(areaRatio * 100).toFixed(1)}%)`
        }
      })
    },
    
    // 按人头分摊
    calculateByHeadcount() {
      const perPersonAmount = this.totalBillAmount / this.tenants.length
      return this.tenants.map(tenant => ({
        tenantId: tenant.id,
        tenantName: tenant.name,
        amount: perPersonAmount,
        ratio: 1 / this.tenants.length,
        allocationBasis: '按人头分配',
        details: '平均分配'
      }))
    },
    
    // 按时间分摊
    calculateByTime(targetAmount = this.utilityBillAmount) {
      return this.tenants.map(tenant => {
        const timeRatio = parseInt(tenant.occupancyDays) / this.totalOccupancyDays
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          amount: targetAmount * timeRatio,
          ratio: timeRatio,
          allocationBasis: '按时长分配',
          details: `居住天数: ${tenant.occupancyDays}天 (占比${(timeRatio * 100).toFixed(1)}%)`
        }
      })
    },
    
    // 按设备使用分摊
    calculateByDevice() {
      // 计算每个租户的设备总功耗
      const tenantDeviceConsumptions = this.tenants.map(tenant => {
        const totalDevicePower = tenant.devices.reduce((sum, device) => 
          sum + (parseFloat(device.power) * parseFloat(device.usageHours)), 0)
        return {
          tenantId: tenant.id,
          totalDevicePower: totalDevicePower
        }
      })
      
      // 计算总功耗
      const totalDevicePower = tenantDeviceConsumptions.reduce((sum, item) => 
        sum + item.totalDevicePower, 0)
      
      if (totalDevicePower === 0) {
        // 如果没有设备数据，回退到面积分配
        return this.calculateByArea()
      }
      
      return this.tenants.map(tenant => {
        const deviceData = tenantDeviceConsumptions.find(d => d.tenantId === tenant.id)
        const ratio = deviceData.totalDevicePower / totalDevicePower
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          amount: this.totalBillAmount * ratio,
          ratio: ratio,
          allocationBasis: '按设备使用分配',
          details: `设备总功耗: ${deviceData.totalDevicePower.toFixed(2)}瓦时 (占比${(ratio * 100).toFixed(1)}%)`
        }
      })
    },
    
    // 自定义比例分摊
    calculateByCustomRatio() {
      // 确保自定义比例数组长度与租户数量匹配
      while (this.customRatios.length < this.tenants.length) {
        this.customRatios.push(0)
      }
      
      while (this.customRatios.length > this.tenants.length) {
        this.customRatios.pop()
      }
      
      // 标准化比例，确保总和为1
      const ratioSum = this.customRatios.reduce((sum, ratio) => sum + parseFloat(ratio || 0), 0)
      
      // 如果总和为0，则平均分配
      if (ratioSum === 0) {
        return this.calculateByHeadcount()
      }
      
      const normalizedRatios = this.customRatios.map(ratio => parseFloat(ratio || 0) / ratioSum)
      
      return this.tenants.map((tenant, index) => {
        const ratio = normalizedRatios[index] || 0
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          amount: this.totalBillAmount * ratio,
          ratio: ratio,
          allocationBasis: '自定义比例分配',
          details: `自定义比例: ${(ratio * 100).toFixed(1)}%`
        }
      })
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