import React, { useEffect, useState } from 'react';
import {
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import BaseCard from '../../components/BaseCard/BaseCard';
import { useNavigate } from 'react-router';
import config from '../../config/config';
import InputSearch from '../../components/forms/inputSearch/search';

interface Customer {
    customer: string;
}

const ListCustomerProfiles = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const token = sessionStorage.getItem('token');

                if (!token) {
                    navigate('/auth/login');
                    return;
                }

                const myHeaders = new Headers();
                myHeaders.append('authToken', token);
                myHeaders.append('Content-Type', 'application/json');

                const res = await fetch(`${config.rutaApi}employee_system_list`, {
                    method: 'GET',
                    headers: myHeaders,
                });

                if (res.status === 401) {
                    sessionStorage.removeItem('token');
                    navigate('/auth/login');
                    return;
                }

                if (!res.ok) {
                    throw new Error('Failed to fetch customers');
                }

                const data = await res.json();

                // Extract unique customers from the response
                const uniqueCustomers: Customer[] = [];
                const customerSet = new Set<string>();

                // The API returns an object, find the array within it
                let employeeList: any[] = [];

                // Try common response wrapper patterns
                if (Array.isArray(data)) {
                    employeeList = data;
                } else if (data.employees && Array.isArray(data.employees)) {
                    employeeList = data.employees;
                } else if (data.data && Array.isArray(data.data)) {
                    employeeList = data.data;
                } else if (data.list && Array.isArray(data.list)) {
                    employeeList = data.list;
                } else if (data.results && Array.isArray(data.results)) {
                    employeeList = data.results;
                } else {
                    // Check if any property is an array
                    const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
                    if (arrayKey) {
                        employeeList = data[arrayKey];
                    }
                }

                employeeList.forEach((item: any) => {
                    const customerName = item?.customer;
                    if (customerName && typeof customerName === 'string' && customerName.trim() !== '' && !customerSet.has(customerName)) {
                        customerSet.add(customerName);
                        uniqueCustomers.push({ customer: customerName });
                    }
                });

                // Sort customers alphabetically
                uniqueCustomers.sort((a, b) => a.customer.localeCompare(b.customer));

                setCustomers(uniqueCustomers);
                setFilteredCustomers(uniqueCustomers);
            } catch (err: any) {
                setError(err.message || 'Error loading customers');
                console.error('Error fetching customers:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, [navigate]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredCustomers(customers);
        } else {
            const filtered = customers.filter(customer =>
                customer.customer.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCustomers(filtered);
        }
    }, [searchTerm, customers]);

    const handleViewProfile = (customerName: string) => {
        navigate(`/profiles/customerProfile?nameCustomer=${encodeURIComponent(customerName)}`);
    };

    return (
        <BaseCard title="Customer Profile">
            <Box>
                <Box sx={{ mb: 3 }}>
                    <InputSearch
                        searchTerm={searchTerm}
                        onSearchChange={(value: string) => setSearchTerm(value)}
                        onClearSearch={() => setSearchTerm('')}
                        placeholder="Search by customer name..."
                        width="100%"
                    />
                </Box>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                ) : filteredCustomers.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                        <Typography variant="body1" color="text.secondary">
                            {customers.length === 0 ? 'No customers found' : 'No customers match your search'}
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer
                        sx={{
                            boxShadow: 'none',
                            border: '1px solid #eee',
                            borderRadius: 2,
                        }}
                    >
                        <Table aria-label="customers table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <Typography variant="h6" fontWeight={600}>
                                            Customer Name
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography variant="h6" fontWeight={600}>
                                            Actions
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredCustomers.map((customer, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>
                                            <Typography variant="body1" fontWeight={500}>
                                                {customer.customer}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleViewProfile(customer.customer)}
                                                sx={{
                                                    backgroundColor: '#0D4B3B',
                                                    color: '#ffffff',
                                                    textTransform: 'none',
                                                    '&:hover': {
                                                        backgroundColor: '#0a3d32',
                                                    },
                                                }}
                                            >
                                                View Profile
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </BaseCard>
    );
};

export default ListCustomerProfiles;
