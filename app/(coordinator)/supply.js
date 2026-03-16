import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import OrdersTable from '../../components/OrdersTable';

export default function supply() {
    const [ORDERs, setORDERs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedStatuses, setSelectedStatuses] = useState([]);

    const toggleStatus = (status) => {
        setSelectedStatuses((prev) =>
            prev.includes(status)
                ? prev.filter((c) => c !== status)
                : [...prev, status]
        );
    };

    useEffect(() => {
        const API_URL = process.env.EXPO_PUBLIC_API_URL;
        // ==FIX==
        // token
        // fetch
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkY2JmODk1NS0zMTZmLTQ5NzQtYmZmMC1kYzQ4ODI3N2Y2YTQiLCJlbWFpbCI6ImNvb3JkaW5hdG9yQGdtYWlsLmNvbSIsInJvbGUiOiJzdXBwbHlfY29vcmRpbmF0b3IiLCJzdG9yZUlkIjpudWxsLCJpYXQiOjE3NzM2NzYyNTksImV4cCI6MTc3MzY3OTg1OX0.6Ow8b9bwDGX8aFLciNg_NI1OjIbYw5josQTJGi4QOyU';

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

    const OrderStatus = {
        pending: { color: '#BB4D00', backgroundColor: '#FEF3C6', text: 'Đang chờ' },
        approved: { color: '#008236', backgroundColor: '#DBFCE7', text: 'Đã duyệt' },
        rejected: { color: '#C10007', backgroundColor: '#FFE2E2', text: 'Đã từ chối' },
        delivering: { color: '#1447E6', backgroundColor: '#DBEAFE', text: 'Đang giao' },
        in_transit: { color: '#1447E6', backgroundColor: '#DBEAFE', text: 'Đang vận chuyển' },
        transit: { color: '#1447E6', backgroundColor: '#DBEAFE', text: 'Đang vận chuyển' },
        cancelled: { color: '#666', backgroundColor: '#CCC', text: 'Đã hủy' },
        delivered: { color: '#666', backgroundColor: '#CCC', text: 'Đã giao' },
        picking: { color: '#666', backgroundColor: '#CCC', text: 'Đang lấy hàng' },
        completed: { color: '#666', backgroundColor: '#CCC', text: 'Hoàn tất' },
        claimed: { color: '#666', backgroundColor: '#CCC', text: 'Đã khiếu nại' },
    };

    const listOrderStatus = [
        'pending',
        'approved',
        'rejected',
        'delivering',
        'in_transit',
        'transit',
        'cancelled',
        'delivered',
        'picking',
        'completed',
        'claimed',
    ];

    const filteredData = useMemo(() => {
        if (!ORDERs) return [];

        return ORDERs.filter((item) => {
            const matchStatus = selectedStatuses?.length === 0 ? true : selectedStatuses.includes(item.status);

            return matchStatus;
        });
    }, [ORDERs, selectedStatuses]);

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

            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterColor}
                >
                    {listOrderStatus?.map((status, i) => {
                        const active = selectedStatuses.includes(status);

                        return (
                            <Pressable
                                key={i}
                                style={[
                                    styles.filterColor.colorBtn,
                                    active && { backgroundColor: OrderStatus?.[status]?.backgroundColor, borderColor: OrderStatus?.[status]?.color },
                                ]}
                                onPress={() => toggleStatus(status)}
                            >
                                <Text
                                    style={[
                                        styles.filterColor.colorText,
                                        active && { color: OrderStatus?.[status]?.color, fontWeight: '700' },
                                    ]}
                                >
                                    {OrderStatus?.[status]?.text}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.section}>
                <OrdersTable
                    orders={filteredData}
                    loading={loading}
                    error={error}
                    OrderStatus={OrderStatus}
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
        maxHeight: 500,
    },

    filterColor: {
        gap: 8,

        colorBtn: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#ccc',
        },

        colorText: {
            fontSize: 14,
            color: '#333',
        },
    },
});