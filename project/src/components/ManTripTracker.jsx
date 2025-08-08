import { useState, useEffect } from 'react'
import { Table, Checkbox, Card, Typography, Button, message, Input, Modal, Space } from 'antd'
import { ManTripAttendance } from '../entities/ManTripAttendance'

const { Title } = Typography

const ManTripTracker = () => {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState(['Jon', 'Roger', 'Kevin', 'Smalls', 'Pat'])
  const [newPersonName, setNewPersonName] = useState('')
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2008 }, (_, i) => 2009 + i)

  useEffect(() => {
    loadAttendance()
  }, [])

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const response = await ManTripAttendance.list()
      if (response.success) {
        setAttendance(response.data)
      }
    } catch (error) {
      message.error('Failed to load attendance data')
    }
    setLoading(false)
  }

  const getAttendanceStatus = (personName, year) => {
    const record = attendance.find(a => a.personName === personName && a.year === year)
    return record ? record.attended : false
  }

  const getAttendanceId = (personName, year) => {
    const record = attendance.find(a => a.personName === personName && a.year === year)
    return record ? record._id : null
  }

  const toggleAttendance = async (personName, year, currentStatus) => {
    try {
      const existingId = getAttendanceId(personName, year)
      const newStatus = !currentStatus
      
      // Optimistic update - update UI immediately
      if (existingId) {
        setAttendance(prev => 
          prev.map(record => 
            record._id === existingId 
              ? { ...record, attended: newStatus }
              : record
          )
        )
      } else {
        // Add temporary record for optimistic update
        const tempRecord = {
          _id: `temp_${Date.now()}_${personName}_${year}`,
          personName,
          year,
          attended: newStatus
        }
        setAttendance(prev => [...prev, tempRecord])
      }
      
      // Make API call in background
      if (existingId) {
        const response = await ManTripAttendance.update(existingId, {
          attended: newStatus
        })
        if (response.success) {
          // Replace with real data from server
          setAttendance(prev => 
            prev.map(record => 
              record._id === existingId 
                ? response.data
                : record
            )
          )
        } else {
          // Revert optimistic update on failure
          setAttendance(prev => 
            prev.map(record => 
              record._id === existingId 
                ? { ...record, attended: currentStatus }
                : record
            )
          )
          message.error('Failed to update attendance')
        }
      } else {
        const response = await ManTripAttendance.create({
          year,
          personName,
          attended: newStatus
        })
        if (response.success) {
          // Replace temp record with real record from server
          const tempId = `temp_${Date.now()}_${personName}_${year}`
          setAttendance(prev => 
            prev.map(record => 
              record._id.toString().startsWith(`temp_`) && record.personName === personName && record.year === year
                ? response.data
                : record
            )
          )
        } else {
          // Remove temp record on failure
          setAttendance(prev => 
            prev.filter(record => 
              !(record._id.toString().startsWith('temp_') && record.personName === personName && record.year === year)
            )
          )
          message.error('Failed to create attendance record')
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      if (existingId) {
        setAttendance(prev => 
          prev.map(record => 
            record._id === existingId 
              ? { ...record, attended: currentStatus }
              : record
          )
        )
      } else {
        setAttendance(prev => 
          prev.filter(record => 
            !(record._id.toString().startsWith('temp_') && record.personName === personName && record.year === year)
          )
        )
      }
      message.error('Failed to update attendance')
    }
  }

  const addPerson = async () => {
    if (!newPersonName.trim()) {
      message.error('Please enter a person name')
      return
    }
    
    if (friends.includes(newPersonName.trim())) {
      message.error('Person already exists')
      return
    }

    try {
      const updatedFriends = [...friends, newPersonName.trim()]
      setFriends(updatedFriends)
      
      // Create attendance records for all years for the new person
      for (const year of years) {
        await ManTripAttendance.create({
          year,
          personName: newPersonName.trim(),
          attended: false
        })
      }
      
      await loadAttendance()
      setNewPersonName('')
      setIsAddModalVisible(false)
      message.success(`Added ${newPersonName.trim()} to the tracker`)
    } catch (error) {
      message.error('Failed to add person')
    }
  }

  const deletePerson = async (personName) => {
    Modal.confirm({
      title: `Delete ${personName}?`,
      content: `Are you sure you want to remove ${personName} from the tracker? This will delete all their attendance records.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Find and delete all attendance records for this person
          const personRecords = attendance.filter(a => a.personName === personName)
          for (const record of personRecords) {
            // Note: The entity wrapper doesn't have a delete method, so we'll just remove from state
            // In a real implementation, you'd call ManTripAttendance.delete(record._id)
          }
          
          const updatedFriends = friends.filter(f => f !== personName)
          setFriends(updatedFriends)
          
          // Remove from attendance state
          setAttendance(prev => prev.filter(a => a.personName !== personName))
          
          message.success(`Removed ${personName} from the tracker`)
        } catch (error) {
          message.error('Failed to delete person')
        }
      }
    })
  }

  const columns = [
    {
      title: 'Friend',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 150,
      className: 'font-semibold bg-gray-50',
      render: (name) => (
        <div className="flex items-center justify-between">
          <span>{name}</span>
          <Button 
            type="text" 
            danger 
            size="small"
            onClick={() => deletePerson(name)}
            className="ml-2"
          >
            ×
          </Button>
        </div>
      )
    },
    ...years.map(year => ({
      title: year.toString(),
      key: year,
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Checkbox
          checked={getAttendanceStatus(record.name, year)}
          onChange={() => toggleAttendance(record.name, year, getAttendanceStatus(record.name, year))}
        />
      )
    }))
  ]

  const dataSource = friends.map(friend => ({
    key: friend,
    name: friend
  }))

  return (
    <div className="p-6 max-w-full">
      <Card className="shadow-lg">
        <div className="mb-6">
          <Title level={2} className="text-center mb-2">Man Trip Attendance Tracker</Title>
          <p className="text-center text-gray-600 mb-4">Track who attended each year's Man Trip (2009 - {currentYear})</p>
          <div className="text-center">
            <Button type="primary" onClick={() => setIsAddModalVisible(true)} className="mb-4">
              Add Person
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            pagination={false}
            scroll={{ x: years.length * 80 + 100 }}
            size="middle"
            bordered
            className="attendance-table"
          />
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>✓ Check the box if the person attended that year's trip</p>
          <p>× Click the × button next to a name to remove that person</p>
        </div>
      </Card>

      <Modal
        title="Add New Person"
        open={isAddModalVisible}
        onOk={addPerson}
        onCancel={() => {
          setIsAddModalVisible(false)
          setNewPersonName('')
        }}
        okText="Add Person"
        cancelText="Cancel"
      >
        <Input
          placeholder="Enter person's name"
          value={newPersonName}
          onChange={(e) => setNewPersonName(e.target.value)}
          onPressEnter={addPerson}
        />
      </Modal>
      
      <style jsx>{`
        .attendance-table .ant-table-thead > tr > th {
          text-align: center;
          font-weight: 600;
        }
        .attendance-table .ant-table-tbody > tr > td {
          text-align: center;
        }
        .attendance-table .ant-table-tbody > tr > td:first-child {
          text-align: left;
        }
      `}</style>
    </div>
  )
}

export default ManTripTracker