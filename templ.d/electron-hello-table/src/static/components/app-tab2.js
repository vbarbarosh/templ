app.component('app-tab2', {
    inject: ['app'],
    template: `
        <div>
            <s-table2 v-bind:items="items" v-bind:columns="columns" />
        </div>
    `,
    data: function () {
        return {
            items: [
                {
                    group: true,
                    label: 'Engineering',
                    items: [
                        {
                            'department': 'Engineering',
                            'team': 'Frontend',
                            'name': 'John Smith',
                            'position': 'Senior Developer',
                            'q1_score': 85,
                            'q2_score': 88,
                            'q3_score': 92,
                            'q4_score': 90,
                            'total': 355
                        },
                        {
                            'department': 'Engineering',
                            'team': 'Frontend',
                            'name': 'Emily Johnson',
                            'position': 'Junior Developer',
                            'q1_score': 78,
                            'q2_score': 82,
                            'q3_score': 85,
                            'q4_score': 88,
                            'total': 333
                        },
                        {
                            'department': 'Engineering',
                            'team': 'Backend',
                            'name': 'Michael Chen',
                            'position': 'Lead Developer',
                            'q1_score': 92,
                            'q2_score': 94,
                            'q3_score': 96,
                            'q4_score': 95,
                            'total': 377
                        },
                        {
                            'department': 'Engineering',
                            'team': 'Backend',
                            'name': 'Sarah Williams',
                            'position': 'Developer',
                            'q1_score': 85,
                            'q2_score': 87,
                            'q3_score': 89,
                            'q4_score': 91,
                            'total': 352
                        },
                    ],
                },
                {
                    label: 'Marketing',
                    group: true,
                    items: [
                        {
                            'department': 'Marketing',
                            'team': 'Digital',
                            'name': 'David Brown',
                            'position': 'Marketing Manager',
                            'q1_score': 82,
                            'q2_score': 85,
                            'q3_score': 88,
                            'q4_score': 90,
                            'total': 345
                        },
                        {
                            'department': 'Marketing',
                            'team': 'Content',
                            'name': 'Jessica Lee',
                            'position': 'Content Specialist',
                            'q1_score': 88,
                            'q2_score': 90,
                            'q3_score': 92,
                            'q4_score': 94,
                            'total': 364
                        },
                    ]
                },
                {
                    label: 'Sales',
                    group: true,
                    items: [
                        {
                            'department': 'Sales',
                            'team': 'Enterprise',
                            'name': 'Robert Taylor',
                            'position': 'Account Executive',
                            'q1_score': 75,
                            'q2_score': 80,
                            'q3_score': 85,
                            'q4_score': 92,
                            'total': 332
                        },
                        {
                            'department': 'Sales',
                            'team': 'SMB',
                            'name': 'Jennifer Adams',
                            'position': 'Sales Representative',
                            'q1_score': 82,
                            'q2_score': 84,
                            'q3_score': 86,
                            'q4_score': 88,
                            'total': 340
                        }
                    ],
                },
            ],
            columns: [
                // {label: 'Department', read: v => v.department},
                {label: 'Team', read: v => v.team},
                {label: 'Name', read: v => v.name},
                {label: 'Position', read: v => v.position},
                {label: 'q1_score', read: v => v.q1_score},
                {label: 'q2_score', read: v => v.q2_score},
                {label: 'q3_score', read: v => v.q3_score},
                {label: 'q4_score', read: v => v.q4_score},
                {label: 'Total', read: v => v.total},
            ],
        };
    },
});
