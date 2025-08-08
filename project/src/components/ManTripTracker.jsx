import { useState, useEffect } from 'react'
import { Table, Checkbox, Card, Typography, Button, message } from 'antd'
import { ManTripAttendance } from '../entities/ManTripAttendance'

const { Title } = Typography

const ManTripTracker = () => {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  
  const friends = ['Jon', 'Roger', 'Kevin', 'Smalls', 'Pat']
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
      
      if (existingId) {
        const response = await ManTripAttendance.update(existingId, {
          attended: !currentStatus
        })
        if (response.success) {
          await loadAttendance()
          message.success(`Updated ${personName}'s attendance for ${year}`)
        }
      } else {
        const response = await ManTripAttendance.create({
          year,
          personName,
          attended: !currentStatus
        })
        if (response.success) {
          await loadAttendance()
          message.success(`Added ${personName}'s attendance for ${year}`)
        }
      }
    } catch (error) {
      message.error('Failed to update attendance')
    }
  }

  const initializeAllData = async () => {
    try {
      for (const year of years) {
        for (const friend of friends) {
          const existingRecord = attendance.find(a => a.personName === friend && a.year === year)
          if (!existingRecord) {
            await ManTripAttendance.create({
              year,
              personName: friend,
              attended: false
            })
          }
        }
      }
      await loadAttendance()
      message.success('Initialized all attendance records')
    } catch (error) {
      message.error('Failed to initialize data')
    }
  }

  const columns = [
    {
      title: 'Friend',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 100,
      className: 'font-semibold bg-gray-50'
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
            <Button type="primary" onClick={initializeAllData} className="mb-4">
              Initialize All Records
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
          <p>Click "Initialize All Records" to set up empty records for all friends and years</p>
        </div>
      </Card>
      
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