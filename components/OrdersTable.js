import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function OrdersTable({
    orders,
    loading,
    error,
    OrderStatus,
}) {
    const router = useRouter();

    const renderItem = ({ item: order, index }) => {
        return (
            <View style={styles.row}>
                <View style={styles.col}>
                    <View style={styles.cell}>
                        <Text style={styles.bold}>#{index + 1}</Text>
                        <Text style={styles.smallMuted}>
                            Tạo lúc: {order.createdAt?.split('T')?.[0] || ''}
                        </Text>
                    </View>

                    <View style={styles.cell}>
                        <Text>Cửa hàng: {order.store?.name}</Text>
                    </View>

                    <View style={styles.cell}>
                        <Text style={styles.muted}>
                            Ngày giao: {order.deliveryDate?.split('T')?.[0] || ''}
                        </Text>
                    </View>
                </View>
                {/* <View style={styles.cellRight}>
                    <Text>{order.totalAmount}</Text>
                </View> */}

                <View style={styles.col}>
                    <View style={styles.cellCenter}>
                        <View style={[styles.statusBadge, { backgroundColor: OrderStatus?.[order.status]?.backgroundColor }]}>
                            <Text style={[styles.statusText, { color: OrderStatus?.[order.status]?.color }]}>
                                {OrderStatus?.[order.status]?.text}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.viewBtn}
                            onPress={() =>
                                router.push({
                                    pathname: '/order-detail',
                                    params: {
                                        orderId: order.id,
                                        link: 'brand',
                                    },
                                })
                            }
                        >
                            <Text style={styles.viewText}>Chi tiết</Text>
                            <Ionicons name='arrow-forward' size={12} color='#666' />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Đang tải đơn hàng...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>
                    Không thể tải danh sách đơn hàng.
                </Text>
            </View>
        );
    }

    return (
        <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={orders?.length === 0 && styles.center}
            ListEmptyComponent={
                <View style={styles.center}>
                    <Text style={styles.muted}>
                        Không có đơn hàng nào khớp với bộ lọc.
                    </Text>
                </View>
            }
        />
    );
}

const styles = StyleSheet.create({
    row: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    col: {
        justifyContent: 'center',
    },

    cell: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 12,
        marginBottom: 4,
    },

    cellRight: {
        alignItems: 'flex-end',
    },

    cellCenter: {
        alignItems: 'center',
    },

    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 8,
    },

    bold: {
        fontWeight: '700',
    },

    muted: {
        color: '#6b7280',
    },

    smallMuted: {
        fontSize: 12,
        color: '#6b7280',
    },

    statusBadge: {
        backgroundColor: '#eee',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },

    statusText: {
        color: '#666',
        fontSize: 10,
        fontWeight: '700',
    },

    viewBtn: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },

    viewText: {
        fontSize: 12,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },

    error: {
        color: 'red',
    },
});