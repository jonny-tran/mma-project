import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import OrdersTable from '../../components/OrdersTable';
// import { parseListQuery } from '@/app/supply/_components/query';
// import BaseFilter from '@/components/layout/BaseFilter';

export default function supply() {
    const [ORDERs, setORDERs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const API_URL = process.env.EXPO_PUBLIC_API_URL;
        // ==FIX==
        // token
        // fetch
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkY2JmODk1NS0zMTZmLTQ5NzQtYmZmMC1kYzQ4ODI3N2Y2YTQiLCJlbWFpbCI6ImNvb3JkaW5hdG9yQGdtYWlsLmNvbSIsInJvbGUiOiJzdXBwbHlfY29vcmRpbmF0b3IiLCJzdG9yZUlkIjpudWxsLCJpYXQiOjE3NzM2NzI1NzAsImV4cCI6MTc3MzY3NjE3MH0.RUKTu9TTwW8TEkarNY4c7Ve_MyIFgUc2o8ybGUkHpC8';

        fetch(`${API_URL}/orders`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((json) => {
                setORDERs(json?.data?.items);
            })
            .catch((err) => {
                setError(err);
                console.log('Catch an error: ', err);
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // const parsedQuery = useMemo(
    //     () =>
    //         parseListQuery(searchParams, {
    //             page: 1,
    //             limit: 10,
    //             sortOrder: 'DESC',
    //         }),
    //     [searchParams]
    // );
    // const filterConfig = [
    //     {
    //         key: 'status',
    //         label: 'Trạng thái',
    //         type: 'select',
    //         options: Object.values(OrderStatus).map((status) => ({
    //             label: status,
    //             value: status,
    //         })),
    //     },
    //     {
    //         key: 'limit',
    //         label: 'Số dòng',
    //         type: 'select',
    //         defaultValue: String(parsedQuery.limit),
    //         options: [
    //             { label: '10', value: '10' },
    //             { label: '20', value: '20' },
    //             { label: '50', value: '50' },
    //         ],
    //     },
    //     {
    //         key: 'sortOrder',
    //         label: 'Sắp xếp',
    //         type: 'select',
    //         defaultValue: parsedQuery.sortOrder,
    //         options: [
    //             { label: 'Mới nhất', value: 'DESC' },
    //             { label: 'Cũ nhất', value: 'ASC' },
    //         ],
    //     },
    //     {
    //         key: 'fromDate',
    //         label: 'Từ ngày',
    //         type: 'date',
    //     },
    //     {
    //         key: 'toDate',
    //         label: 'Đến ngày',
    //         type: 'date',
    //     },
    // ];

    console.log('ORDERs', ORDERs);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý Đơn hàng</Text>
                <Text style={styles.subtitle}>
                    Phê duyệt, từ chối và theo dõi trạng thái đơn hàng cho vai trò điều
                    phối viên.
                </Text>
            </View>

            {/* <BaseFilter config={filterConfig} /> */}

            <View style={styles.section}>
                <OrdersTable
                    orders={ORDERs}
                    loading={loading}
                    error={error}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
    },

    header: {
        marginBottom: 8,
    },

    title: {
        fontSize: 22,
        fontWeight: '900',
    },

    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
        maxWidth: 320,
    },

    section: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingVertical: 8,
        elevation: 2,
        maxHeight: 540,
    },
});